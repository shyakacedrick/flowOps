// ============================================================================
//  authApi — authentication & session endpoints
// ----------------------------------------------------------------------------
//  Backend not yet implemented; these wrappers are call-site-ready so the day
//  the API exists, only this file changes.
// ============================================================================

import { api, setAuthToken } from '@/services/api.js';

export const authApi = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials, { auth: false });
    if (res.ok && res.data?.token) setAuthToken(res.data.token);
    return res;
  },

  register: async (payload) => {
    const res = await api.post('/auth/register', payload, { auth: false });
    if (res.ok && res.data?.token) setAuthToken(res.data.token);
    return res;
  },

  logout: async () => {
    // Order matters: the server needs the access token in the Authorization
    // header to blacklist its jti. Clear local state only after the call
    // completes (success or failure — we always want the client logged out).
    try {
      return await api.post('/auth/logout');
    } finally {
      setAuthToken(null);
    }
  },

  me:           ()        => api.get('/auth/me'),
  refresh:      ()        => api.post('/auth/refresh'),
  requestDemo:  (payload) => api.post('/auth/demo', payload, { auth: false }),

  // ── Email verification ────────────────────────────────────────────────
  // resendVerifyEmail requires the user to be signed in (the server uses
  // req.user). confirmVerifyEmail is public — anyone with the token can use it.
  resendVerifyEmail:  ()       => api.post('/auth/verify-email/send'),
  confirmVerifyEmail: (token)  => api.post('/auth/verify-email/confirm', { token }, { auth: false }),

  // ── Password reset ────────────────────────────────────────────────────
  // forgotPassword always returns 200 — don't leak whether the email exists.
  forgotPassword: (email)            => api.post('/auth/forgot-password', { email },             { auth: false }),
  resetPassword:  (token, password)  => api.post('/auth/reset-password',  { token, password },   { auth: false }),
};

export default authApi;
