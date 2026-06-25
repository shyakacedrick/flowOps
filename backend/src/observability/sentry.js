// ============================================================================
//  observability/sentry.js — error tracking
// ----------------------------------------------------------------------------
//  Wraps @sentry/node initialization so the rest of the app can call
//  `captureException(err, { req })` without caring whether Sentry is
//  enabled. If SENTRY_DSN is unset, every helper becomes a no-op so dev
//  and CI don't depend on a Sentry account.
//
//  Token scrubbing: we install a `beforeSend` hook that strips bearer
//  tokens, refresh cookies, and known auth-related body fields BEFORE
//  the event leaves the process. This is mandatory for the OWASP "do not
//  log secrets" requirement.
// ============================================================================

import * as Sentry from '@sentry/node';
import env from '../config/env.js';

const SCRUB_HEADER_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
]);

const SCRUB_BODY_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'token',
  'refreshToken',
  'accessToken',
  'jwt',
  'secret',
]);

function scrubObject(obj, keyset) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (keyset.has(k.toLowerCase())) {
      out[k] = '[redacted]';
    } else if (v && typeof v === 'object') {
      out[k] = scrubObject(v, keyset);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function beforeSend(event) {
  try {
    if (event.request) {
      if (event.request.headers) {
        event.request.headers = scrubObject(event.request.headers, SCRUB_HEADER_KEYS);
      }
      if (event.request.cookies) {
        event.request.cookies = '[redacted]';
      }
      if (event.request.data && typeof event.request.data === 'object') {
        event.request.data = scrubObject(event.request.data, SCRUB_BODY_KEYS);
      }
    }
    if (event.extra) {
      event.extra = scrubObject(event.extra, SCRUB_BODY_KEYS);
    }
  } catch {
    // Never fail a Sentry send because of scrubbing — drop the event
    // entirely if the scrub itself throws.
    return null;
  }
  return event;
}

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // Sentry disabled — every helper below is a no-op.

  Sentry.init({
    dsn,
    environment: env.nodeEnv,
    release: process.env.SENTRY_RELEASE || undefined,
    // Server-side performance tracing OFF by default — it's expensive
    // and the free tier's transaction quota burns through fast.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    beforeSend,
  });
  initialized = true;
  // eslint-disable-next-line no-console
  console.log(`[sentry] enabled (env=${env.nodeEnv})`);
}

export function captureException(err, context = {}) {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context.req) {
      const r = context.req;
      scope.setTag('http.method', r.method);
      scope.setTag('http.route', r.originalUrl || r.url);
      if (r.user?.id) scope.setUser({ id: String(r.user.id), role: r.user.role });
      if (r.user?.organizationId) scope.setTag('org', String(r.user.organizationId));
    }
    if (context.tags) {
      for (const [k, v] of Object.entries(context.tags)) scope.setTag(k, String(v));
    }
    Sentry.captureException(err);
  });
}

export function getRequestHandler() {
  if (!initialized) return (_req, _res, next) => next();
  return Sentry.Handlers?.requestHandler?.() ?? ((_req, _res, next) => next());
}

export function getErrorHandler() {
  if (!initialized) return (err, _req, _res, next) => next(err);
  // Only forward 500+ to Sentry — 4xx errors are caller faults.
  return Sentry.Handlers?.errorHandler?.({
    shouldHandleError: (error) => {
      const status = error?.statusCode ?? error?.status ?? 500;
      return status >= 500;
    },
  }) ?? ((err, _req, _res, next) => next(err));
}

/** Test-only helper. */
export function _isInitializedForTests() {
  return initialized;
}

export default { initSentry, captureException, getRequestHandler, getErrorHandler };
