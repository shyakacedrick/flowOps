import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success, created, noContent } from '../utils/apiResponse.js';
import Organization from '../models/Organization.js';
import User, { USER_ROLES } from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { logOrganizationCreated } from '../services/activityService.js';
import { uploadOrgLogo, ORG_LOGO_DIR } from '../middleware/uploadOrgLogo.js';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';

/**
 * Visibility rules:
 *  - platform_admin sees all organizations.
 *  - business_owner / staff see only their own organization.
 */
const scopeFilter = (user) => {
  if (user.role === USER_ROLES.PLATFORM_ADMIN) return {};
  if (!user.organizationId) return { _id: null }; // matches nothing
  return { _id: user.organizationId };
};

/**
 * GET /api/organizations
 */
export const listOrganizations = asyncHandler(async (req, res) => {
  const orgs = await Organization.find(scopeFilter(req.user)).sort({ createdAt: -1 });
  return success(res, orgs);
});

/**
 * POST /api/organizations
 * Platform admin: can create any org.
 * Business owner without an org: can create their own (and gets attached to it).
 */
export const createOrganization = asyncHandler(async (req, res) => {
  const { name, industry, description } = req.body || {};
  if (!name || !industry) {
    throw ApiError.badRequest('name and industry are required');
  }

  const isAdmin = req.user.role === USER_ROLES.PLATFORM_ADMIN;
  const isOwner = req.user.role === USER_ROLES.BUSINESS_OWNER;

  if (!isAdmin && !isOwner) {
    throw ApiError.forbidden('Only platform admins or business owners can create organizations');
  }

  if (isOwner && req.user.organizationId) {
    throw ApiError.conflict('You already belong to an organization');
  }

  const org = await Organization.create({
    name,
    industry,
    description,
    ownerId: isOwner ? req.user._id : null,
  });

  if (isOwner) {
    await User.findByIdAndUpdate(req.user._id, { organizationId: org._id });
    req.user.organizationId = org._id;
  }

  // Seed a default Starter trial so every org has a corresponding
  // subscription row from day one. 14-day trial is the standard default;
  // admins can edit the period or flip status to 'active' via the admin
  // Subscriptions page. Failure here must not roll the org back — orgs
  // without a subscription doc still work, the admin page just shows
  // them with the implicit defaults.
  try {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    await Subscription.create({
      organizationId:     org._id,
      plan:               org.plan || 'starter',
      status:             'trialing',
      currentPeriodStart: now,
      currentPeriodEnd:   trialEnd,
      trialEndsAt:        trialEnd,
      seats:              1,
    });
  } catch (err) {
    // Duplicate-key (subscription already exists for this org) is the
    // only realistic failure here and is safe to swallow.
    if (err?.code !== 11000) {
      // eslint-disable-next-line no-console
      console.error('[org-create] failed to seed subscription', err);
    }
  }

  await logOrganizationCreated(org, req.user);
  return created(res, org);
});

/**
 * GET /api/organizations/:id
 */
export const getOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findOne({ _id: req.params.id, ...scopeFilter(req.user) });
  if (!org) throw ApiError.notFound('Organization not found');
  return success(res, org);
});

/**
 * PATCH /api/organizations/:id
 */
export const updateOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findOne({ _id: req.params.id, ...scopeFilter(req.user) });
  if (!org) throw ApiError.notFound('Organization not found');

  // Staff cannot edit; only platform_admin or the business_owner of this org.
  const isAdmin = req.user.role === USER_ROLES.PLATFORM_ADMIN;
  const isOwnerOfOrg =
    req.user.role === USER_ROLES.BUSINESS_OWNER &&
    String(req.user.organizationId) === String(org._id);
  if (!isAdmin && !isOwnerOfOrg) {
    throw ApiError.forbidden('You do not have permission to update this organization');
  }

  // Owners can edit identity & description; platform admins can additionally
  // change plan and toggle suspension. We translate `suspended: true|false`
  // into the timestamp field so the API surface stays boolean-friendly.
  const updatable = ['name', 'industry', 'description'];
  if (isAdmin) updatable.push('plan', 'suspensionReason');
  for (const key of updatable) {
    if (key in (req.body || {})) org[key] = req.body[key];
  }
  if (isAdmin && 'suspended' in (req.body || {})) {
    org.suspendedAt = req.body.suspended ? (org.suspendedAt || new Date()) : null;
    if (!req.body.suspended) org.suspensionReason = '';
  }
  await org.save();

  // Keep the org's subscription doc in sync when an admin changes plan
  // directly on the organization. Mirror only — the Subscription endpoint
  // is the authoritative way to change billing details (status, period,
  // price). Best-effort; never blocks the org update.
  if (isAdmin && 'plan' in (req.body || {})) {
    try {
      await Subscription.updateOne(
        { organizationId: org._id },
        { $set: { plan: org.plan, updatedBy: req.user._id } },
        { upsert: true }
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[org-update] failed to mirror plan to subscription', err);
    }
  }

  return success(res, org);
});

/**
 * DELETE /api/organizations/:id  (platform_admin only)
 */
export const deleteOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw ApiError.notFound('Organization not found');
  await org.deleteOne();
  return noContent(res);
});

// ── Logo upload ─────────────────────────────────────────────────────────────
// Permission rules mirror PATCH: platform_admin or the org's business owner.
// On success we delete the previous file (if any) so the uploads directory
// doesn't accumulate orphans across edits.

function assertCanEditOrg(req, org) {
  const isAdmin = req.user.role === USER_ROLES.PLATFORM_ADMIN;
  const isOwnerOfOrg =
    req.user.role === USER_ROLES.BUSINESS_OWNER &&
    String(req.user.organizationId) === String(org._id);
  if (!isAdmin && !isOwnerOfOrg) {
    throw ApiError.forbidden('You do not have permission to update this organization');
  }
}

async function deleteFileIfUnderUploadDir(relativeUrl) {
  if (!relativeUrl) return;
  // Only touch files we own. relativeUrl looks like '/uploads/org-logos/<id>.png'.
  const match = /^\/uploads\/org-logos\/([A-Za-z0-9._-]+)$/.exec(relativeUrl);
  if (!match) return;
  const abs = path.join(ORG_LOGO_DIR, match[1]);
  try { await fs.unlink(abs); } catch { /* missing file is fine */ }
}

/**
 * POST /api/organizations/:id/logo
 * Multipart body: { logo: <file> }
 */
export const uploadLogo = [
  // Wrap multer so its async errors flow through our error handler with a
  // human-friendly 400 instead of a 500.
  (req, res, next) => {
    uploadOrgLogo(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ApiError.badRequest('Logo file is too large (max 2 MB).'));
        }
        return next(ApiError.badRequest(err.message || 'Upload failed.'));
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return next(ApiError.badRequest(err.message));
      }
      return next(err);
    });
  },
  asyncHandler(async (req, res) => {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      // Clean up the file the parser already wrote to disk.
      if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
      throw ApiError.notFound('Organization not found');
    }
    try {
      assertCanEditOrg(req, org);
    } catch (err) {
      if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
      throw err;
    }
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded. Field name must be "logo".');
    }

    // Remove the previous logo file (if any) before swapping in the new URL.
    await deleteFileIfUnderUploadDir(org.logoUrl);

    org.logoUrl = `/uploads/org-logos/${req.file.filename}`;
    await org.save();

    return success(res, org);
  }),
];

/**
 * DELETE /api/organizations/:id/logo
 */
export const deleteLogo = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw ApiError.notFound('Organization not found');
  assertCanEditOrg(req, org);

  await deleteFileIfUnderUploadDir(org.logoUrl);
  org.logoUrl = null;
  await org.save();

  return success(res, org);
});

export default {
  listOrganizations,
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  uploadLogo,
  deleteLogo,
};
