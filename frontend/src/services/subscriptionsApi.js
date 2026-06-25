// ============================================================================
//  subscriptionsApi — admin billing endpoints
// ----------------------------------------------------------------------------

import { api } from '@/services/api.js';

export const subscriptionsApi = {
  list:  ()                => api.get('/admin/subscriptions'),
  get:   (orgId)           => api.get(`/admin/subscriptions/${encodeURIComponent(orgId)}`),
  patch: (orgId, body)     => api.patch(`/admin/subscriptions/${encodeURIComponent(orgId)}`, body),
};

export default subscriptionsApi;
