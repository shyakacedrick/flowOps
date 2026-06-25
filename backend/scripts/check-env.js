#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-env — parity check between .env.example and process.env.
//
// Reads .env.example, extracts every KEY=…, and asserts each one resolves
// to a non-empty value in process.env. Designed to fail fast in CI and at
// container startup so a missing secret is caught BEFORE the API starts
// serving traffic.
//
// Some keys are intentionally optional in some deployments (e.g. the SMTP
// block is unused when RESEND_API_KEY is set). Those are listed in
// OPTIONAL_KEYS and only warned about.
//
// Usage:
//   node scripts/check-env.js          → exit 0 if all required present
//   node scripts/check-env.js --json   → machine-readable report
// ──────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXAMPLE_PATH = path.join(ROOT, '.env.example');
const ENV_PATH = path.join(ROOT, '.env');

// Either provider is enough — both being empty is fine for dev (console
// fallback) but warned about for prod-like environments.
const OPTIONAL_KEYS = new Set([
  'APP_URL',
  'MONGO_MAX_POOL_SIZE',
  'MONGO_SERVER_SELECTION_TIMEOUT_MS',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'BCRYPT_SALT_ROUNDS',
  'REFRESH_COOKIE_NAME',
  'CORS_ORIGINS',
  'LOG_LEVEL',
  'RESEND_API_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
  'EMAIL_VERIFY_TTL_HOURS',
  'PASSWORD_RESET_TTL_MINS',
  'SENTRY_DSN',
  'SENTRY_TRACES_SAMPLE_RATE',
  'SENTRY_RELEASE',
]);

// Load .env so this script can be run standalone (`npm run check:env`)
// without npm pre-loading it. Existing process.env wins.
if (fs.existsSync(ENV_PATH)) dotenv.config({ path: ENV_PATH });

if (!fs.existsSync(EXAMPLE_PATH)) {
  console.error(`[check-env] .env.example not found at ${EXAMPLE_PATH}`);
  process.exit(2);
}

const lines = fs.readFileSync(EXAMPLE_PATH, 'utf8').split(/\r?\n/);
const keys = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([A-Z][A-Z0-9_]*)=/);
  if (match) keys.push(match[1]);
}

const missing = [];
const optionalMissing = [];

for (const key of keys) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (OPTIONAL_KEYS.has(key)) optionalMissing.push(key);
    else missing.push(key);
  }
}

const wantJson = process.argv.includes('--json');
const report = {
  checked: keys.length,
  missingRequired: missing,
  missingOptional: optionalMissing,
  ok: missing.length === 0,
};

if (wantJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`[check-env] Checked ${keys.length} keys from .env.example`);
  if (optionalMissing.length) {
    console.warn(
      `[check-env] Optional keys not set (ok in dev): ${optionalMissing.join(', ')}`
    );
  }
  if (missing.length) {
    console.error(
      `[check-env] MISSING required keys: ${missing.join(', ')}\n` +
        `[check-env] Copy .env.example to .env and fill these in.`
    );
  } else {
    console.log('[check-env] All required environment variables present.');
  }
}

process.exit(report.ok ? 0 : 1);
