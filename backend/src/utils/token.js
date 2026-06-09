import { randomUUID, randomBytes, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Sign an access token. Always carries a random `jti` so the auth
 * middleware can blacklist individual tokens on logout.
 */
export const signToken = (payload, options = {}) =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtAccessExpiresIn,
    jwtid: options.jwtid || randomUUID(),
    ...options,
  });

/** Sign an access token with the canonical {sub, role} payload. */
export const signAccessToken = (user) =>
  signToken({ sub: user.id || user._id?.toString(), role: user.role });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

/**
 * Generate a refresh token. We return the RAW token (to ship to the
 * client in an HTTP-only cookie) plus its sha256 hash (the only thing
 * that ever touches the database).
 */
export const generateRefreshToken = () => {
  const raw = randomBytes(48).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
};

export const hashRefreshToken = (raw) =>
  createHash('sha256').update(raw).digest('hex');

export default { signToken, signAccessToken, verifyToken, generateRefreshToken, hashRefreshToken };
