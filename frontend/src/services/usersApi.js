// ============================================================================
//  usersApi — admin-only cross-tenant user management
// ----------------------------------------------------------------------------
//  Backed by /api/users (platform_admin only). Owners/staff invite users via
//  inviteApi instead; this client is consumed by the Admin workspace.
// ============================================================================

import { api } from '@/services/api.js';

const buildQuery = (params) => {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.append(k, v);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
};

export const usersApi = {
  list:   (params)   => api.get(`/users${buildQuery(params)}`),
  update: (id, body) => api.patch(`/users/${id}`, body),
};

export default usersApi;
