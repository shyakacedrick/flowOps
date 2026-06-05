// ============================================================================
//  analyticsApi — KPIs, charts, historical reports
// ----------------------------------------------------------------------------

import { api } from '@/services/api.js';

export const analyticsApi = {
  overview:        (range = 'today') => api.get(`/analytics/overview?range=${encodeURIComponent(range)}`),
  throughput:      (range)           => api.get(`/analytics/throughput?range=${encodeURIComponent(range)}`),
  waitTimes:       (range)           => api.get(`/analytics/wait-times?range=${encodeURIComponent(range)}`),
  staffPerformance:(range)           => api.get(`/analytics/staff?range=${encodeURIComponent(range)}`),
  customerFlow:    (range)           => api.get(`/analytics/flow?range=${encodeURIComponent(range)}`),
  export:          (format = 'csv')  => api.get(`/analytics/export?format=${encodeURIComponent(format)}`),
};

export default analyticsApi;
