// ============================================================================
//  observability/sentry.js — frontend Sentry wrapper
// ----------------------------------------------------------------------------
//  No-op when VITE_SENTRY_DSN is unset (dev + CI). When set, captures
//  unhandled errors with breadcrumbs. We scrub bearer tokens and known
//  auth fields BEFORE the event leaves the browser.
// ============================================================================

import * as Sentry from '@sentry/react';

const SCRUB_HEADER_KEYS = new Set([
  'authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token',
]);
const SCRUB_BODY_KEYS = new Set([
  'password', 'newPassword', 'currentPassword',
  'token', 'refreshToken', 'accessToken', 'jwt', 'secret',
]);

function scrubObject(obj, keyset) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (keyset.has(k.toLowerCase())) out[k] = '[redacted]';
    else if (v && typeof v === 'object') out[k] = scrubObject(v, keyset);
    else out[k] = v;
  }
  return out;
}

function beforeSend(event) {
  try {
    if (event.request) {
      if (event.request.headers) {
        event.request.headers = scrubObject(event.request.headers, SCRUB_HEADER_KEYS);
      }
      if (event.request.cookies) event.request.cookies = '[redacted]';
      if (event.request.data && typeof event.request.data === 'object') {
        event.request.data = scrubObject(event.request.data, SCRUB_BODY_KEYS);
      }
      // Strip access-token query parameters (used by SSE).
      if (event.request.url) {
        event.request.url = event.request.url.replace(/([?&])token=[^&]+/gi, '$1token=[redacted]');
      }
    }
    if (event.extra) event.extra = scrubObject(event.extra, SCRUB_BODY_KEYS);
  } catch {
    return null;
  }
  return event;
}

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = import.meta.env?.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env?.MODE || 'production',
    release: import.meta.env?.VITE_SENTRY_RELEASE || undefined,
    // No tracing or replays by default — keeps free-tier quota usable.
    tracesSampleRate: 0,
    beforeSend,
  });
  initialized = true;
  // eslint-disable-next-line no-console
  console.log('[sentry] enabled');
}

export function captureException(err, context = {}) {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context.tags) {
      for (const [k, v] of Object.entries(context.tags)) scope.setTag(k, String(v));
    }
    if (context.user) scope.setUser(context.user);
    Sentry.captureException(err);
  });
}

export function setUser(user) {
  if (!initialized) return;
  Sentry.setUser(user || null);
}

/** React error-boundary helper. Returns a no-op wrapper if Sentry is off. */
export function withErrorBoundary(Component, options) {
  if (!initialized) return Component;
  return Sentry.withErrorBoundary(Component, options);
}

export default { initSentry, captureException, setUser, withErrorBoundary };
