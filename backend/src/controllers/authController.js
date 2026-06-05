import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success, created } from '../utils/apiResponse.js';
import { signToken } from '../utils/token.js';
import User, { USER_ROLES } from '../models/User.js';
import {
  logUserRegistered,
  logUserLogin,
} from '../services/activityService.js';

const buildAuthPayload = (user) => ({
  user: user.toJSON(),
  token: signToken({ sub: user.id, role: user.role }),
});

/**
 * POST /api/auth/register
 * Public registration. Defaults to `staff` role; only an existing
 * platform admin can create another platform admin (enforced here).
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, organizationId } = req.body || {};

  if (!name || !email || !password) {
    throw ApiError.badRequest('name, email and password are required');
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters');
  }

  const requestedRole = role || USER_ROLES.STAFF;
  if (!Object.values(USER_ROLES).includes(requestedRole)) {
    throw ApiError.badRequest(
      `role must be one of: ${Object.values(USER_ROLES).join(', ')}`
    );
  }
  if (requestedRole === USER_ROLES.PLATFORM_ADMIN) {
    // platform_admin can only be created by another platform_admin
    const platformAdminExists = await User.exists({ role: USER_ROLES.PLATFORM_ADMIN });
    if (platformAdminExists) {
      throw ApiError.forbidden(
        'Only an existing platform admin can register another platform admin'
      );
    }
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('Email is already registered');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: requestedRole,
    organizationId: organizationId || null,
  });

  await logUserRegistered(user);

  return created(res, buildAuthPayload(user));
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw ApiError.badRequest('email and password are required');
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select(
    '+passwordHash'
  );
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  const valid = await user.comparePassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  await logUserLogin(user);

  return success(res, buildAuthPayload(user));
});

/**
 * GET /api/auth/me
 */
export const me = asyncHandler(async (req, res) => success(res, { user: req.user.toJSON() }));

export default { register, login, me };
