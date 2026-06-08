// ============================================================================
//  organizationApi — REST wrappers for /api/organizations
// ============================================================================

import { api } from '@/services/api.js';

export const organizationApi = {
  list:   ()        => api.get('/organizations'),
  get:    (id)      => api.get(`/organizations/${id}`),
  create: (payload) => api.post('/organizations', payload),
  update: (id, body) => api.patch(`/organizations/${id}`, body),
  remove: (id)      => api.delete(`/organizations/${id}`),
};

export default organizationApi;
