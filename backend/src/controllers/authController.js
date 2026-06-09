import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success, created } from '../utils/apiResponse.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../utils/token.js';
import env from '../config/env.js';
import User, { USER_ROLES } from '../models/User.js';
import Organization, { ORGANIZATION_PLANS } from '../models/Organization.js';
import RefreshToken from '../models/RefreshToken.js';
import RevokedToken from '../models/RevokedToken.js';
import VerificationToken, { TOKEN_TYPES } from '../models/VerificationToken.js';
import { sendMail } from '../services/mailer.js';
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
} from '../services/emailTemplates.js';
import {
  logUserRegistered,
  logUserLogin,
  logOrganizationCreated,
} from '../services/activityService.js';

// ────────────────────────────────────────────────────────────────────────────
//  Password rules
//  Plan 11.1: ≥10 chars, must contain at least 1 letter + 1 number.
// ────────────────────────────────────────────────────────────────────────────
const MIN_PASSWORD_LEN = 10;
const PASSWORD_HAS_LETTER = /[a-zA-Z]/;
const PASSWORD_HAS_NUMBER = /\d/;

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LEN) {
    throw ApiError.badRequest(
      `Password must be at least ${MIN_PASSWORD_LEN} characters`
    );
  }
  if (!PASSWORD_HAS_LETTER.test(password) || !PASSWORD_HAS_NUMBER.test(password)) {
    throw ApiError.badRequest(
      'Password must contain at least one letter and one number'
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  Refresh-token cookie helpers
//  HttpOnly + SameSite=Lax + Secure (in prod only — local dev runs HTTP).
//  Scoped to /api/auth so it isn't sent on every request.
// ────────────────────────────────────────────────────────────────────────────
const REFRESH_TTL_DAYS = 30;
const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

function setRefreshCookie(res, rawToken) {
  res.cookie(env.refreshCookieName, rawToken, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TTL_MS,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(env.refreshCookieName, { path: '/api/auth' });
}

async function issueRefreshToken(user, req) {
  const { raw, hash } = generateRefreshToken();
  await RefreshToken.create({
    tokenHash: hash,
    userId:    user._id,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    userAgent: (req.headers['user-agent'] || '').slice(0, 256),
    ip:        req.ip || null,
  });
  return raw;
}

async function buildAuthPayload(user, req, res) {
  const token = signAccessToken(user);
  const refresh = await issueRefreshToken(user, req);
  setRefreshCookie(res, refresh);
  return { user: user.toJSON(), token };
}

// ────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/register
// ────────────────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    organizationId,
    company,
    plan,
  } = req.body || {};

  if (!name || !email || !password) {
    throw ApiError.badRequest('name, email and password are required');
  }
  validatePassword(password);

  const isWorkspaceSignup = typeof company === 'string' && company.trim().length > 0;
  const requestedRole = isWorkspaceSignup
    ? USER_ROLES.BUSINESS_OWNER
    : role || USER_ROLES.STAFF;

  if (!Object.values(USER_ROLES).includes(requestedRole)) {
    throw ApiError.badRequest(
      `role must be one of: ${Object.values(USER_ROLES).join(', ')}`
    );
  }
  if (requestedRole === USER_ROLES.PLATFORM_ADMIN) {
    const platformAdminExists = await User.exists({ role: USER_ROLES.PLATFORM_ADMIN });
    if (platformAdminExists) {
      throw ApiError.forbidden(
        'Only an existing platform admin can register another platform admin'
      );
    }
  }
  if (plan && !ORGANIZATION_PLANS.includes(plan)) {
    throw ApiError.badRequest(
      `plan must be one of: ${ORGANIZATION_PLANS.join(', ')}`
    );
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

  if (isWorkspaceSignup) {
    const org = await Organization.create({
      name: company.trim(),
      industry: 'other',
      plan: plan || 'starter',
      ownerId: user._id,
    });
    user.organizationId = org._id;
    await user.save();
    await logOrganizationCreated(org, user);
  }

  await logUserRegistered(user);

  // Fire-and-forget: a mail-provider outage must not break signup.
  sendVerificationEmail(user).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[auth] verify-email send failed:', err?.message || err);
  });

  return created(res, await buildAuthPayload(user, req, res));
});

// ────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ────────────────────────────────────────────────────────────────────────────
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

  return success(res, await buildAuthPayload(user, req, res));
});

// ────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/refresh
//  Rotates the refresh token (old one is invalidated immediately) and
//  issues a fresh access token. Detected reuse of a revoked token is
//  treated as a compromise signal and clears all of the user's refresh
//  tokens to force re-login everywhere.
// ────────────────────────────────────────────────────────────────────────────
export const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[env.refreshCookieName];
  if (!raw) throw ApiError.unauthorized('Missing refresh token');

  const hash = hashRefreshToken(raw);
  const stored = await RefreshToken.findOne({ tokenHash: hash });

  if (!stored) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token is invalid');
  }
  if (stored.revokedAt) {
    // Token reuse detected — best-effort revoke everything for this user.
    await RefreshToken.updateMany(
      { userId: stored.userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token has been revoked');
  }
  if (stored.expiresAt <= new Date()) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token has expired');
  }

  const user = await User.findById(stored.userId);
  if (!user) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('User no longer exists');
  }

  // Rotate.
  stored.revokedAt = new Date();
  await stored.save();
  const newRaw = await issueRefreshToken(user, req);
  setRefreshCookie(res, newRaw);

  return success(res, { user: user.toJSON(), token: signAccessToken(user) });
});

// ────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/logout
//  Revokes the current refresh token AND blacklists the current access
//  token's `jti` until its natural exp.
// ────────────────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  // Revoke refresh token (cookie) — best-effort.
  const raw = req.cookies?.[env.refreshCookieName];
  if (raw) {
    const hash = hashRefreshToken(raw);
    await RefreshToken.updateOne(
      { tokenHash: hash, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
  clearRefreshCookie(res);

  // Blacklist current access token by jti so it stops working right now.
  if (req.auth?.jti && req.auth?.exp) {
    try {
      await RevokedToken.create({
        jti: req.auth.jti,
        expiresAt: new Date(req.auth.exp * 1000),
        userId: req.user?._id || null,
        reason: 'logout',
      });
    } catch {
      // Duplicate-jti race is fine — already blacklisted.
    }
  }

  return success(res, { ok: true });
});

// ────────────────────────────────────────────────────────────────────────────
//  GET /api/auth/me
// ────────────────────────────────────────────────────────────────────────────
export const me = asyncHandler(async (req, res) =>
  success(res, { user: req.user.toJSON() })
);

// ════════════════════════════════════════════════════════════════════════════
//  Email verification & password reset
// ────────────────────────────────────────────────────────────────────────────
//  Tokens: 32-byte URL-safe random, sha256-hashed at rest, single-use,
//  TTL-indexed. Verify links live for env.emailVerifyTtlHours, reset links
//  for env.passwordResetTtlMins.
//
//  Privacy: forgot-password ALWAYS returns 200 — we never reveal whether an
//  email is registered. Email-verification re-send is similarly silent for
//  already-verified addresses.
// ════════════════════════════════════════════════════════════════════════════

const EMAIL_VERIFY_TTL_MS = () => env.emailVerifyTtlHours  * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = () => env.passwordResetTtlMins * 60 * 1000;

/**
 * Issues a fresh verify-email token, invalidates any older live ones,
 * and sends the templated email. Used by register + by the resend endpoint.
 */
async function sendVerificationEmail(user) {
  if (user.emailVerifiedAt) return; // already verified — nothing to do.

  await VerificationToken.deleteMany({
    userId: user._id,
    type: TOKEN_TYPES.VERIFY_EMAIL,
    consumedAt: null,
  });

  const { raw, hash } = VerificationToken.generate();
  await VerificationToken.create({
    tokenHash: hash,
    type:      TOKEN_TYPES.VERIFY_EMAIL,
    userId:    user._id,
    expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS()),
  });

  const url = `${env.appUrl}/verify-email/${encodeURIComponent(raw)}`;
  const { subject, html, text } = verifyEmailTemplate({
    name:     user.name,
    url,
    ttlHours: env.emailVerifyTtlHours,
  });
  await sendMail({ to: user.email, subject, html, text });
}

// ────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/verify-email/send   (authenticated)
//  Re-sends the verification link to the currently signed-in user.
//  Rate-limited at the route level.
// ────────────────────────────────────────────────────────────────────────────
export const requestEmailVerification = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.emailVerifiedAt) {
    return success(res, { ok: true, alreadyVerified: true });
  }
  await sendVerificationEmail(user);
  return success(res, { ok: true });
});

// ────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/verify-email/confirm  { token }
//  Public — anyone with the raw token can confirm.
// ────────────────────────────────────────────────────────────────────────────
export const confirmEmailVerification = asyncHandler(async (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    throw ApiError.badRequest('Verification token is required');
  }

  const hash = VerificationToken.hash(token);
  const record = await VerificationToken.findOne({
    tokenHash: hash,
    type: TOKEN_TYPES.VERIFY_EMAIL,
  });
  if (!record) throw ApiError.badRequest('Invalid or expired verification link');
  if (record.consumedAt) throw ApiError.badRequest('This verification link has already been used');
  if (record.expiresAt <= new Date()) throw ApiError.badRequest('This verification link has expired');

  const user = await User.findById(record.userId);
  if (!user) throw ApiError.badRequest('Account no longer exists');

  if (!user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date();
    await user.save();
  }
  record.consumedAt = new Date();
  await record.save();

  return success(res, { ok: true, user: user.toJSON() });
});

// ────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/forgot-password   { email }
//  Always 200, even for unknown emails. The work happens only when the
//  email matches a real account.
// ────────────────────────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    // Still 200 — we don't leak validation behaviour either.
    return success(res, { ok: true });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return success(res, { ok: true });

  // Invalidate previous live reset tokens for this user.
  await VerificationToken.deleteMany({
    userId: user._id,
    type: TOKEN_TYPES.PASSWORD_RESET,
    consumedAt: null,
  });

  const { raw, hash } = VerificationToken.generate();
  await VerificationToken.create({
    tokenHash: hash,
    type:      TOKEN_TYPES.PASSWORD_RESET,
    userId:    user._id,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS()),
  });

  const url = `${env.appUrl}/reset-password/${encodeURIComponent(raw)}`;
  const { subject, html, text } = resetPasswordTemplate({
    name:    user.name,
    url,
    ttlMins: env.passwordResetTtlMins,
  });
  // Fire-and-forget — never reveal mail-provider state to the client.
  sendMail({ to: user.email, subject, html, text }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[auth] reset-password send failed:', err?.message || err);
  });

  return success(res, { ok: true });
});

// ────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/reset-password   { token, password }
//  Single-use. On success: rotate password + invalidate ALL refresh tokens
//  for the user (forces re-login on every device).
// ────────────────────────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || typeof token !== 'string') {
    throw ApiError.badRequest('Reset token is required');
  }
  validatePassword(password);

  const hash = VerificationToken.hash(token);
  const record = await VerificationToken.findOne({
    tokenHash: hash,
    type: TOKEN_TYPES.PASSWORD_RESET,
  });
  if (!record) throw ApiError.badRequest('Invalid or expired reset link');
  if (record.consumedAt) throw ApiError.badRequest('This reset link has already been used');
  if (record.expiresAt <= new Date()) throw ApiError.badRequest('This reset link has expired');

  const user = await User.findById(record.userId);
  if (!user) throw ApiError.badRequest('Account no longer exists');

  user.passwordHash = await User.hashPassword(password);
  await user.save();

  record.consumedAt = new Date();
  await record.save();

  // Compromise-safe default: kill every existing refresh token so an
  // attacker holding one is forced back through login.
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  return success(res, { ok: true });
});

export default {
  register,
  login,
  refresh,
  logout,
  me,
  requestEmailVerification,
  confirmEmailVerification,
  forgotPassword,
  resetPassword,
};
// Also exported for the invite controller, which builds the same payload.
export { buildAuthPayload };
