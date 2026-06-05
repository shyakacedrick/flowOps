// ============================================================================
//  queueApi — live queue operations
// ----------------------------------------------------------------------------

import { api } from '@/services/api.js';

export const queueApi = {
  list:    (params)         => api.get(`/queue${toQuery(params)}`),
  current: ()               => api.get('/queue/current'),
  enqueue: (customer)       => api.post('/queue', customer),
  serve:   (customerId)     => api.post(`/queue/${customerId}/serve`),
  skip:    (customerId)     => api.post(`/queue/${customerId}/skip`),
  reset:   ()               => api.post('/queue/reset'),
  stats:   (range = 'today')=> api.get(`/queue/stats?range=${encodeURIComponent(range)}`),
};

function toQuery(params) {
  if (!params || typeof params !== 'object') return '';
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : '';
}

export default queueApi;
