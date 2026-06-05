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
    setAuthToken(null);
    return api.post('/auth/logout');
  },

  me:           ()        => api.get('/auth/me'),
  refresh:      ()        => api.post('/auth/refresh'),
  requestDemo:  (payload) => api.post('/auth/demo', payload, { auth: false }),
};

export default authApi;
