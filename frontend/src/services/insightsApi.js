// ============================================================================
//  insightsApi — AI-powered smart insights
// ----------------------------------------------------------------------------

import { api } from '@/services/api.js';

export const insightsApi = {
  list:      ()              => api.get('/insights'),
  generate:  ()              => api.post('/insights/generate'),
  dismiss:   (id)            => api.post(`/insights/${id}/dismiss`),
  apply:     (id)            => api.post(`/insights/${id}/apply`),
  history:   (range='week')  => api.get(`/insights/history?range=${encodeURIComponent(range)}`),
};

export default insightsApi;
