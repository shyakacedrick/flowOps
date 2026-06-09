import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success, created, noContent } from '../utils/apiResponse.js';
import Organization from '../models/Organization.js';
import User, { USER_ROLES } from '../models/User.js';
import { logOrganizationCreated } from '../services/activityService.js';

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

export default {
  listOrganizations,
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
};
