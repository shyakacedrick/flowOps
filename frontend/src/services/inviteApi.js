// ============================================================================
//  inviteApi — REST wrappers for /api/invites and /api/public/invites
// ----------------------------------------------------------------------------
//  Authenticated CRUD is for owners/admins. The two public helpers (peek +
//  accept) are used by the accept-invite page where the user has no token.
// ============================================================================

import { api, request } from '@/services/api.js';

export const inviteApi = {
  list:   ()         => api.get('/invites'),
  create: (payload)  => api.post('/invites', payload),
  revoke: (id)       => api.delete(`/invites/${id}`),

  // Public — never sends the Bearer token.
  getPublic: (token) =>
    request(`/public/invites/${token}`, { auth: false }),
  acceptPublic: (token, payload) =>
    request(`/public/invites/${token}/accept`, {
      method: 'POST',
      body: payload,
      auth: false,
    }),
};

export default inviteApi;
