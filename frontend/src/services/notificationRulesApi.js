// ============================================================================
//  notificationRulesApi — admin CRUD for /api/admin/notification-rules
// ----------------------------------------------------------------------------

import { api } from '@/services/api.js';

export const notificationRulesApi = {
  list:   ()             => api.get('/admin/notification-rules'),
  create: (body)         => api.post('/admin/notification-rules', body),
  patch:  (key, body)    => api.patch(`/admin/notification-rules/${encodeURIComponent(key)}`, body),
  remove: (key)          => api.delete(`/admin/notification-rules/${encodeURIComponent(key)}`),
};

export default notificationRulesApi;
