// ============================================================================
//  featureFlagsApi — admin CRUD for /api/admin/feature-flags
// ----------------------------------------------------------------------------

import { api } from '@/services/api.js';

export const featureFlagsApi = {
  list:   ()             => api.get('/admin/feature-flags'),
  create: (body)         => api.post('/admin/feature-flags', body),
  patch:  (key, body)    => api.patch(`/admin/feature-flags/${encodeURIComponent(key)}`, body),
  remove: (key)          => api.delete(`/admin/feature-flags/${encodeURIComponent(key)}`),
};

export default featureFlagsApi;
