// ============================================================================
//  userController — cross-tenant user management (platform admin only)
// ----------------------------------------------------------------------------
//  Owners/staff manage their own org's members through the invite flow; this
//  controller is the *admin* surface for the entire FlowOps user base.
//
//  Endpoints (all require role=platform_admin via routes/userRoutes.js):
//    GET    /api/users                     list, with optional filters
//    PATCH  /api/users/:id                 change role / suspend / move org
//
//  Guard rails (enforced here, not just in the route):
//   - Admin cannot demote themselves to a non-admin role.
//   - Admin cannot suspend themselves.
//   - Last remaining platform_admin cannot be demoted (avoids lockout).
//   - Suspending a user revokes every refresh token they hold so any open
//     tab loses access on the next 15-minute access-token expiry.
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success } from '../utils/apiResponse.js';
import User, { USER_ROLES } from '../models/User.js';
import Organization from '../models/Organization.js';
import RefreshToken from '../models/RefreshToken.js';

const ROLES = Object.values(USER_ROLES);

/**
 * GET /api/users
 * Query params (all optional):
 *   organizationId — restrict to one org
 *   role           — restrict to one role
 *   suspended      — 'true' | 'false'
 *   search         — case-insensitive substring match on name + email
 *   limit          — 1..200, default 100
 */
export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.organizationId) {
    filter.organizationId = req.query.organizationId;
  }
  if (req.query.role) {
    if (!ROLES.includes(req.query.role)) {
      throw ApiError.badRequest(`role must be one of: ${ROLES.join(', ')}`);
    }
    filter.role = req.query.role;
  }
  if (req.query.suspended === 'true')  filter.suspendedAt = { $ne: null };
  if (req.query.suspended === 'false') filter.suspendedAt = null;

  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search)), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);

  const rows = await User.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('organizationId', 'name industry plan suspendedAt');

  return success(res, rows);
});

/**
 * PATCH /api/users/:id
 * Body (any subset):
 *   role           — new role (validates against USER_ROLES)
 *   suspended      — boolean; true sets suspendedAt=now, false clears it
 *   organizationId — reassign to an org (or null to detach)
 *   name           — display name fix-up
 */
export const updateUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('User not found');

  const isSelf = String(req.user._id) === String(target._id);
  const body = req.body || {};

  // ── Role change ─────────────────────────────────────────────────────────
  if ('role' in body) {
    if (!ROLES.includes(body.role)) {
      throw ApiError.badRequest(`role must be one of: ${ROLES.join(', ')}`);
    }
    // Self-demote guard: admin cannot strip themselves of admin.
    if (isSelf && target.role === USER_ROLES.PLATFORM_ADMIN && body.role !== USER_ROLES.PLATFORM_ADMIN) {
      throw ApiError.forbidden('You cannot demote yourself');
    }
    // Last-admin guard: don't let the only platform admin be demoted.
    if (target.role === USER_ROLES.PLATFORM_ADMIN && body.role !== USER_ROLES.PLATFORM_ADMIN) {
      const remaining = await User.countDocuments({
        role: USER_ROLES.PLATFORM_ADMIN,
        _id: { $ne: target._id },
      });
      if (remaining === 0) {
        throw ApiError.forbidden('Cannot demote the last platform admin');
      }
    }
    target.role = body.role;
  }

  // ── Organization reassignment ───────────────────────────────────────────
  if ('organizationId' in body) {
    if (body.organizationId) {
      const org = await Organization.findById(body.organizationId);
      if (!org) throw ApiError.badRequest('organizationId references a missing org');
      target.organizationId = org._id;
    } else {
      target.organizationId = null;
    }
  }

  // ── Suspension toggle ───────────────────────────────────────────────────
  if ('suspended' in body) {
    if (isSelf) {
      throw ApiError.forbidden('You cannot suspend yourself');
    }
    if (body.suspended && target.role === USER_ROLES.PLATFORM_ADMIN) {
      throw ApiError.forbidden('Platform admins cannot be suspended');
    }
    target.suspendedAt = body.suspended ? (target.suspendedAt || new Date()) : null;
  }

  // ── Trivial name fix-up ─────────────────────────────────────────────────
  if (typeof body.name === 'string' && body.name.trim()) {
    target.name = body.name.trim();
  }

  await target.save();

  // If we just suspended a user, kill every active session immediately.
  // Access tokens still live for ≤15 min but no refresh will succeed.
  if ('suspended' in body && body.suspended) {
    await RefreshToken.deleteMany({ userId: target._id });
  }

  // Repopulate so the response matches the list-view shape.
  await target.populate('organizationId', 'name industry plan suspendedAt');
  return success(res, target);
});

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { listUsers, updateUser };
