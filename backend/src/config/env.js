import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized environment configuration.
 * All process.env access goes through this module so we have a single
 * source of truth and a single place to validate required variables.
 */

const requiredVars = ['JWT_SECRET', 'MONGO_URI'];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.warn(
    `[env] Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in the values.'
  );
}

// CORS allowlist parsing — comma-separated list. `*` is allowed in dev
// only; production should always specify exact origins.
const rawCors = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '*';
const corsOrigins =
  rawCors === '*'
    ? '*'
    : rawCors
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api',

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/flowops',
  // Mongo pool tuning — keeps connection load predictable.
  mongoMaxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
  mongoServerSelectionTimeoutMs:
    Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000,

  jwtSecret: process.env.JWT_SECRET || 'change_me_in_env',
  // Short-lived access tokens + long-lived refresh tokens. The refresh
  // token lives in an HTTP-only cookie and rotates on every use.
  jwtAccessExpiresIn:  process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  // Backwards-compat alias for any caller still passing this through.
  get jwtExpiresIn() { return this.jwtAccessExpiresIn; },

  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

  corsOrigins,
  // Backwards-compat: anything still reading `corsOrigin` keeps working.
  get corsOrigin() {
    return Array.isArray(this.corsOrigins) ? this.corsOrigins.join(',') : this.corsOrigins;
  },

  // Refresh-token cookie name (HTTP-only).
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'flowops_refresh',

  // Structured logging level for pino. Set to 'silent' in tests.
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),

  // ── Email ──────────────────────────────────────────────────────────────
  // The mailer picks a provider based on which credentials are present:
  //   1. RESEND_API_KEY set            → Resend HTTPS API
  //   2. SMTP_HOST set                  → SMTP via nodemailer (Mailtrap,
  //                                        SendGrid SMTP, Postmark SMTP,
  //                                        Gmail, self-hosted, anything)
  //   3. neither                        → console fallback (dev)
  //
  // MAIL_FROM must be a verified sender for whichever provider is used.
  // APP_URL is the SPA base used to build link URLs in templates.
  resendApiKey: process.env.RESEND_API_KEY || '',
  smtpHost:     process.env.SMTP_HOST     || '',
  smtpPort:     Number(process.env.SMTP_PORT) || 587,
  smtpSecure:   process.env.SMTP_SECURE === 'true', // true = port 465 / TLS
  smtpUser:     process.env.SMTP_USER     || '',
  smtpPass:     process.env.SMTP_PASS     || '',
  mailFrom: process.env.MAIL_FROM || 'FlowOps <onboarding@resend.dev>',
  appUrl: (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, ''),

  // TTLs for transactional tokens (in minutes / hours respectively).
  emailVerifyTtlHours:  Number(process.env.EMAIL_VERIFY_TTL_HOURS)  || 24,
  passwordResetTtlMins: Number(process.env.PASSWORD_RESET_TTL_MINS) || 60,
};

env.isProd = env.nodeEnv === 'production';
env.isDev = env.nodeEnv === 'development';
env.isTest = env.nodeEnv === 'test';

if (env.isProd && env.jwtSecret === 'change_me_in_env') {
  // eslint-disable-next-line no-console
  console.error(
    '[env] FATAL: JWT_SECRET is the default in production. ' +
      'Set a strong secret in the environment before serving traffic.'
  );
}

export default env;
