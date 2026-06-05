// ============================================================================
//  api — base HTTP client
// ----------------------------------------------------------------------------
//  Thin wrapper around fetch. Centralizes:
//    - base URL resolution (VITE_API_URL with safe localhost fallback)
//    - JSON parsing
//    - Bearer token injection (reads `flowops.token` from localStorage)
//    - Consistent error envelope: { ok:false, status, message, details? }
//
//  This is the ONE place to evolve when the backend lands — every featureApi
//  imports `request` from here so call-sites never deal with fetch directly.
// ============================================================================

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:4000/api';

const TOKEN_KEY = 'flowops.token';

function getToken() {
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

/**
 * request — fetch wrapper.
 * @param {string} path  — path appended to BASE_URL (must start with `/`)
 * @param {object} opts  — { method, body, headers, signal, auth=true }
 */
export async function request(path, opts = {}) {
  const { method = 'GET', body, headers = {}, signal, auth = true } = opts;

  const finalHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    signal,
  });

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
  return { ok: true, status: res.status, data };
}

export const api = {
  get:    (path, opts)       => request(path, { ...opts, method: 'GET' }),
  post:   (path, body, opts) => request(path, { ...opts, method: 'POST',   body }),
  put:    (path, body, opts) => request(path, { ...opts, method: 'PUT',    body }),
  patch:  (path, body, opts) => request(path, { ...opts, method: 'PATCH',  body }),
  delete: (path, opts)       => request(path, { ...opts, method: 'DELETE' }),
};

export default api;
