import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';
import User, { USER_ROLES } from '../models/User.js';
import Organization from '../models/Organization.js';
import RevokedToken from '../models/RevokedToken.js';

/**
 * Verifies the JWT in the `Authorization: Bearer <token>` header and
 * attaches the resolved user document to `req.user`.
 *
 * Also checks the RevokedToken blacklist so logged-out access tokens
 * stop working immediately instead of waiting for natural expiry.
 */
export const authenticateUser = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authentication token is missing');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Authentication token has expired');
    }
    throw ApiError.unauthorized('Authentication token is invalid');
  }

  // Blacklist check (logout). Cheap: indexed unique lookup on `jti`.
  if (decoded.jti) {
    const revoked = await RevokedToken.exists({ jti: decoded.jti });
    if (revoked) {
      throw ApiError.unauthorized('Session has been revoked');
    }
  }

  const user = await User.findById(decoded.sub).select('+avatarUrl');
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  // Per-user suspension. Platform admins cannot be suspended (enforced at
  // write-time in userController), so this branch only fires for owners/staff.
  if (user.suspendedAt) {
    throw ApiError.forbidden('Your account has been suspended');
  }

  // Per-org suspension. Skipped for platform admins so they can still operate
  // the admin console even when investigating a suspended org. Cheap extra
  // lookup; only projects the fields we need.
  if (user.role !== USER_ROLES.PLATFORM_ADMIN && user.organizationId) {
    const org = await Organization.findById(user.organizationId, 'suspendedAt name').lean();
    if (org?.suspendedAt) {
      throw ApiError.forbidden('Your organization has been suspended');
    }
  }

  req.user = user;
  req.auth = { userId: user.id, role: user.role, jti: decoded.jti, exp: decoded.exp };
  next();
});

export default authenticateUser;
