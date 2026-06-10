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

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    signal,
    // Required so the HttpOnly refresh cookie is sent/received cross-origin.
    credentials: 'include',
  });

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

export default api;
