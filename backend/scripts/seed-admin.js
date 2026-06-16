#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// seed-admin — create or promote a platform_admin user.
//
// Why this exists: the public /api/auth/register endpoint refuses to create
// a second platform_admin, and the first one can only be created when no
// admin exists yet. That makes bootstrapping a prod environment awkward.
// This script bypasses the controller and writes directly through the
// Mongoose model, so it can:
//
//   1. Create a brand-new platform_admin user (if no user with that email
//      exists yet).
//   2. Promote an existing user to platform_admin (clears organizationId
//      so the user passes the orphan-account guard in authController).
//
// In both cases the password is bcrypt-hashed with the same salt rounds
// the rest of the app uses, so the seeded user can sign in immediately
// through the normal /api/auth/login endpoint.
//
// Inputs (env vars, so secrets stay out of shell history):
//   SEED_ADMIN_EMAIL     required — the user's email
//   SEED_ADMIN_PASSWORD  required when creating; optional when promoting
//                         (if provided during promote, password is reset)
//   SEED_ADMIN_NAME      optional — defaults to "Platform Admin"
//
// Usage examples:
//   # PowerShell
//   $env:SEED_ADMIN_EMAIL="admin@flowops.app"
//   $env:SEED_ADMIN_PASSWORD="Str0ng-Pass!"
//   npm run seed:admin
//
//   # bash
//   SEED_ADMIN_EMAIL=admin@flowops.app SEED_ADMIN_PASSWORD='Str0ng-Pass!' \
//     npm run seed:admin
//
// Against a remote DB (e.g. Atlas in prod), prefix MONGO_URI too:
//   MONGO_URI="mongodb+srv://..." SEED_ADMIN_EMAIL=... \
//     SEED_ADMIN_PASSWORD=... npm run seed:admin
// ──────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User, { USER_ROLES } from '../src/models/User.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function die(msg, code = 1) {
  // eslint-disable-next-line no-console
  console.error(`[seed-admin] ${msg}`);
  process.exit(code);
}

function ok(msg) {
  // eslint-disable-next-line no-console
  console.log(`[seed-admin] ${msg}`);
}

const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || '';
const name = (process.env.SEED_ADMIN_NAME || 'Platform Admin').trim();

if (!email) die('SEED_ADMIN_EMAIL is required');
if (!EMAIL_REGEX.test(email)) die(`SEED_ADMIN_EMAIL is not a valid email: ${email}`);
if (password && password.length < 8) {
  die('SEED_ADMIN_PASSWORD must be at least 8 characters when provided');
}

async function main() {
  ok(`connecting to ${redact(env.mongoUri)} …`);
  await mongoose.connect(env.mongoUri, {
    maxPoolSize: env.mongoMaxPoolSize,
    serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
  });

  const existing = await User.findOne({ email });

  if (existing) {
    // ── Promote path ────────────────────────────────────────────────────
    const updates = {
      role: USER_ROLES.PLATFORM_ADMIN,
      organizationId: null,
      suspendedAt: null,
    };
    if (password) {
      updates.passwordHash = await User.hashPassword(password);
    }
    await User.updateOne({ _id: existing._id }, { $set: updates });
    ok(`promoted existing user "${email}" → platform_admin`);
    if (password) ok('password was reset');
    if (!password) ok('password was NOT changed (no SEED_ADMIN_PASSWORD given)');
  } else {
    // ── Create path ─────────────────────────────────────────────────────
    if (!password) die('SEED_ADMIN_PASSWORD is required when creating a new user');
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: USER_ROLES.PLATFORM_ADMIN,
      organizationId: null,
      emailVerifiedAt: new Date(),
    });
    ok(`created new platform_admin "${user.email}" (id: ${user._id})`);
  }

  ok('done. you can now log in via the normal sign-in flow.');
}

/** Hide credentials in printed Mongo URI. */
function redact(uri) {
  try {
    const u = new URL(uri);
    if (u.password) u.password = '***';
    if (u.username) u.username = u.username.replace(/.(?=.{2})/g, '*');
    return u.toString();
  } catch {
    return uri.replace(/\/\/[^@]+@/, '//***:***@');
  }
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed-admin] failed:', err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
