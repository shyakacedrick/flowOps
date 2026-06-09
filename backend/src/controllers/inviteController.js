// ============================================================================
//  inviteController — staff/owner invitations
// ----------------------------------------------------------------------------
//  Authenticated endpoints (owner/admin):
//    POST   /api/invites         create an invite for this org
//    GET    /api/invites         list invites for this org
//    DELETE /api/invites/:id     revoke an invite
//
//  Public endpoints (consumed by accept-invite page, no auth):
//    GET    /api/public/invites/:token         peek at invite (org name, role)
//    POST   /api/public/invites/:token/accept  create user + return auth token
// ============================================================================

import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success, created, noContent } from '../utils/apiResponse.js';
import Invite, { INVITE_ROLES } from '../models/Invite.js';
import User, { USER_ROLES } from '../models/User.js';
import Organization from '../models/Organization.js';
import { logUserRegistered } from '../services/activityService.js';
import { buildAuthPayload } from './authController.js';
import { sendMail } from '../services/mailer.js';
import { inviteTemplate } from '../services/emailTemplates.js';
import env from '../config/env.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_TTL_DAYS = 7;

const assertObjectId = (id, label = 'id') => {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

/**
 * Only owners + platform admins manage invites. Staff cannot invite.
 */
const requireOrgManager = (user) => {
  if (![USER_ROLES.BUSINESS_OWNER, USER_ROLES.PLATFORM_ADMIN].includes(user.role)) {
    throw ApiError.forbidden('Only owners and platform admins can manage invites');
  }
};

/* ============================================================ authenticated */

/**
 * POST /api/invites  { email, role? }
 *
 * Owners create staff invites for their own org. Platform admins can
 * specify any `organizationId` via body (omitted here for simplicity —
 * admin tooling can call it directly with body.organizationId).
 */
export const createInvite = asyncHandler(async (req, res) => {
  requireOrgManager(req.user);

  const { email, role = 'staff', organizationId: bodyOrgId } = req.body || {};
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    throw ApiError.badRequest('A valid email is required');
  }
  if (!INVITE_ROLES.includes(role)) {
    throw ApiError.badRequest(`role must be one of: ${INVITE_ROLES.join(', ')}`);
  }

  const orgId =
    req.user.role === USER_ROLES.PLATFORM_ADMIN && bodyOrgId
      ? bodyOrgId
      : req.user.organizationId;
  if (!orgId) throw ApiError.badRequest('No organization to invite into');
  assertObjectId(orgId, 'organizationId');

  const org = await Organization.findById(orgId);
  if (!org) throw ApiError.notFound('Organization not found');

  // Reject if a user with that email already belongs to the org.
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    organizationId: org._id,
  });
  if (existingUser) {
    throw ApiError.conflict('A user with that email already belongs to this organization');
  }

  // Prevent flooding: cap pending invites per email per org to 1.
  await Invite.deleteMany({
    email: email.toLowerCase(),
    organizationId: org._id,
    acceptedAt: null,
    revokedAt: null,
  });

  const invite = await Invite.create({
    token: Invite.generateToken(),
    email: email.toLowerCase(),
    role,
    organizationId: org._id,
    createdBy: req.user._id,
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  // Send the invite email (fire-and-forget — owner still gets the raw
  // token in the API response as a fallback for manual sharing).
  const url = `${env.appUrl}/invite/${encodeURIComponent(invite.token)}`;
  const { subject, html, text } = inviteTemplate({
    inviterName: req.user.name,
    orgName:     org.name,
    role:        invite.role,
    url,
    ttlDays:     INVITE_TTL_DAYS,
  });
  sendMail({ to: invite.email, subject, html, text }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[invite] mail send failed:', err?.message || err);
  });

  return created(res, invite.toJSON());
});

/**
 * GET /api/invites
 * Lists invites for the caller's org (admins see all if no org).
 */
export const listInvites = asyncHandler(async (req, res) => {
  requireOrgManager(req.user);

  const filter = {};
  if (req.user.role !== USER_ROLES.PLATFORM_ADMIN) {
    if (!req.user.organizationId) {
      return success(res, []);
    }
    filter.organizationId = req.user.organizationId;
  }

  const invites = await Invite.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('createdBy', 'name email')
    .populate('acceptedBy', 'name email');

  return success(res, invites.map((i) => i.toJSON()));
});

/**
 * DELETE /api/invites/:id  — revoke a pending invite
 */
export const revokeInvite = asyncHandler(async (req, res) => {
  requireOrgManager(req.user);
  const { id } = req.params;
  assertObjectId(id);

  const invite = await Invite.findById(id);
  if (!invite) throw ApiError.notFound('Invite not found');

  // Owners can only revoke invites in their own org.
  if (
    req.user.role !== USER_ROLES.PLATFORM_ADMIN &&
    String(invite.organizationId) !== String(req.user.organizationId)
  ) {
    throw ApiError.forbidden('Cannot revoke invites for other organizations');
  }
  if (invite.acceptedAt) {
    throw ApiError.badRequest('Cannot revoke an already-accepted invite');
  }

  invite.revokedAt = new Date();
  await invite.save();
  return noContent(res);
});

/* ===================================================================== public */

/**
 * GET /api/public/invites/:token
 * Lets the accept-invite page render org name + role before asking for
 * a password. Never reveals the inviter, recipient list, or any user PII
 * besides what's intrinsic to the invite itself.
 */
export const getPublicInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const invite = await loadValidInvite(token);
  const org = await Organization.findById(invite.organizationId);
  if (!org) throw ApiError.notFound('Organization no longer exists');

  return success(res, {
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
    organization: {
      _id: org._id,
      name: org.name,
      industry: org.industry,
    },
  });
});

/**
 * POST /api/public/invites/:token/accept  { name, password }
 *
 * Creates the user, marks the invite accepted, and returns a JWT so the
 * client can drop the user straight into their workspace.
 */
export const acceptPublicInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { name, password } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('Name is required');
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters');
  }

  const invite = await loadValidInvite(token);

  // Email might already be taken by a user in a different org — block that.
  const existing = await User.findOne({ email: invite.email });
  if (existing) {
    throw ApiError.conflict(
      'A FlowOps account with this email already exists. Sign in instead.'
    );
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email: invite.email,
    passwordHash,
    role: invite.role,
    organizationId: invite.organizationId,
  });

  invite.acceptedAt = new Date();
  invite.acceptedBy = user._id;
  await invite.save();

  await logUserRegistered(user);

  return created(res, await buildAuthPayload(user, req, res));
});

/* ============================================================== shared util */

async function loadValidInvite(token) {
  if (!token || typeof token !== 'string') {
    throw ApiError.badRequest('Invite token is required');
  }
  const invite = await Invite.findOne({ token });
  if (!invite) throw ApiError.notFound('Invite not found');
  if (invite.acceptedAt) {
    throw new ApiError('This invite has already been accepted', 410);
  }
  if (invite.revokedAt) {
    throw new ApiError('This invite has been revoked', 410);
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new ApiError('This invite has expired', 410);
  }
  return invite;
}

export default {
  createInvite,
  listInvites,
  revokeInvite,
  getPublicInvite,
  acceptPublicInvite,
};
