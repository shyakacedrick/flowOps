// ============================================================================
//  api — base HTTP client
// ----------------------------------------------------------------------------
//  Thin wrapper around fetch. Centralizes:
//    - base URL resolution (VITE_API_URL with safe localhost fallback)
//    - JSON parsing
//    - Bearer token injection (reads `flowops.token` from localStorage)
//    - Refresh-cookie support (credentials: 'include')
//    - Auto-refresh on 401: tries POST /auth/refresh once, then retries the
//      original request with the new access token. Avoids infinite loops via
//      the `_retried` flag and never refresh-loops the refresh endpoint itself.
//    - Consistent error envelope: { ok:false, status, message, details? }
//
//  This is the ONE place to evolve when the backend lands — every featureApi
//  imports `request` from here so call-sites never deal with fetch directly.
// ============================================================================

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

import { STORAGE_KEYS } from '@/shared/constants/storage.js';
const TOKEN_KEY = STORAGE_KEYS.TOKEN;

export function getAuthToken() {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors */
  }
}

// ── Refresh coordination ────────────────────────────────────────────────────
// If multiple in-flight requests hit 401 at once we still only want a single
// refresh round-trip. Concurrent callers await the same promise; once it
// resolves they all retry with the new token.
let refreshInFlight = null;

// ── Cold-start probe ────────────────────────────────────────────────────────
// Render's free tier sleeps after 15 min idle; the first request to a cold
// dyno can take 30–50 s. Instead of leaving the user staring at a blank
// dashboard we dispatch a `flowops:waking` event after 1.5 s of waiting,
// then `flowops:awake` as soon as the first response (success OR failure)
// comes back. WakingSplash listens for both and renders a full-screen
// "we're waking the server" message in between.
//
// Module-level so the probe only ever runs once per page load — after the
// server has responded the flag stays true for the rest of the session.
let serverAwake = false;
const COLD_START_PROBE_MS = 1500;

function dispatchWakeEvent(name) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(name));
  } catch {
    /* ignore — older browsers / non-DOM env */
  }
}

async function tryRefresh() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const body = await res.json().catch(() => null);
      const token = body?.data?.token ?? body?.token ?? null;
      if (token) {
        setAuthToken(token);
        return token;
      }
      return null;
    } catch {
      return null;
    } finally {
      // Cleared after the awaited callers have read the value.
      setTimeout(() => { refreshInFlight = null; }, 0);
    }
  })();
  return refreshInFlight;
}

/**
 * request — fetch wrapper.
 * @param {string} path  — path appended to BASE_URL (must start with `/`)
 * @param {object} opts  — { method, body, headers, signal, auth=true, _retried? }
 */
export async function request(path, opts = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    signal,
    auth = true,
    _retried = false,
  } = opts;

  const finalHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  // Cold-start probe: only ever arms before the very first response of the
  // session. After that the timer is never set, so this adds zero overhead
  // to a warm app.
  let probeTimer = null;
  if (!serverAwake && typeof window !== 'undefined') {
    probeTimer = setTimeout(() => {
      if (!serverAwake) dispatchWakeEvent('flowops:waking');
    }, COLD_START_PROBE_MS);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal,
      // Required so the HttpOnly refresh cookie is sent/received cross-origin.
      credentials: 'include',
    });
  } catch (err) {
    // Network failure (DNS, offline, CORS). Mark awake so we dismiss the
    // splash — the caller will see the thrown error and render its own
    // offline UI. Re-throw so existing callers behave unchanged.
    if (!serverAwake) {
      serverAwake = true;
      dispatchWakeEvent('flowops:awake');
    }
    if (probeTimer) clearTimeout(probeTimer);
    throw err;
  }

  // Got a response — server is reachable. Dismiss any splash that may have
  // been shown and never arm the probe again for this session.
  if (probeTimer) clearTimeout(probeTimer);
  if (!serverAwake) {
    serverAwake = true;
    dispatchWakeEvent('flowops:awake');
  }

  // ── 401 auto-refresh path ────────────────────────────────────────────────
  // Conditions to attempt a refresh:
  //   - we have not already retried this request (avoid loops)
  //   - this isn't the refresh or logout call itself (those use the cookie)
  //   - auth was actually requested for this call
  const isAuthEndpoint =
    path.startsWith('/auth/refresh') || path.startsWith('/auth/logout');

  if (res.status === 401 && auth && !_retried && !isAuthEndpoint) {
    const newToken = await tryRefresh();
    if (newToken) {
      return request(path, { ...opts, _retried: true });
    }
    // Refresh failed — drop the stale access token so subsequent UI sees
    // an unauthenticated state instead of looping on the same dead token.
    // Also fire a global event so AuthProvider can clear React state
    // immediately (otherwise the UI keeps rendering signed-in chrome
    // until the next route change re-runs the auth guards).
    setAuthToken(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('flowops:auth-expired'));
    }
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: data?.message ?? res.statusText ?? 'Request failed',
      details: data,
    };
  }
  // Backend wraps successful responses as { success, data, meta? }.
  // Unwrap here so callers can just use res.data for the actual payload.
  const payload =
    data && typeof data === 'object' && 'success' in data ? data.data : data;
  return { ok: true, status: res.status, data: payload, meta: data?.meta };
}

export const api = {
  get:    (path, opts)       => request(path, { ...opts, method: 'GET' }),
  post:   (path, body, opts) => request(path, { ...opts, method: 'POST',   body }),
  put:    (path, body, opts) => request(path, { ...opts, method: 'PUT',    body }),
  patch:  (path, body, opts) => request(path, { ...opts, method: 'PATCH',  body }),
  delete: (path, opts)       => request(path, { ...opts, method: 'DELETE' }),
};

/**
 * wakeBackend — fire-and-forget ping to /health to nudge a sleeping Render
 * dyno awake as early as possible.
 *
 * Called once at app mount (see App.jsx). The request goes through the
 * cold-start probe machinery in `request()`-adjacent state — same
 * `flowops:waking` / `flowops:awake` events fire — so the WakingSplash
 * shows even for visitors who land on the public marketing page and never
 * click anything.
 *
 * Idempotent: subsequent calls are no-ops once the server has responded.
 * Errors are swallowed; the splash is dismissed by the surrounding logic.
 */
export function wakeBackend() {
  if (typeof window === 'undefined' || serverAwake) return;

  // /health lives at the root of the backend, not under /api. Derive the
  // origin by stripping a trailing /api segment from BASE_URL.
  const healthUrl = BASE_URL.replace(/\/api\/?$/, '') + '/health';

  // Arm the same probe + awake events that `request()` uses, so a slow
  // /health response triggers the splash just like a slow data request.
  let probeTimer = null;
  probeTimer = setTimeout(() => {
    if (!serverAwake) dispatchWakeEvent('flowops:waking');
  }, COLD_START_PROBE_MS);

  fetch(healthUrl, { method: 'GET', credentials: 'omit' })
    .catch(() => { /* swallow — splash will still dismiss in finally */ })
    .finally(() => {
      if (probeTimer) clearTimeout(probeTimer);
      if (!serverAwake) {
        serverAwake = true;
        dispatchWakeEvent('flowops:awake');
      }
    });
}

export default api;
