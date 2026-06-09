import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';
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

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  req.user = user;
  req.auth = { userId: user.id, role: user.role, jti: decoded.jti, exp: decoded.exp };
  next();
});

export default authenticateUser;
