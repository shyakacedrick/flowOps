// ============================================================================
//  ticketApi — REST wrappers for /api/tickets
// ----------------------------------------------------------------------------
//  Mirrors the backend endpoints exposed by ticketRoutes.js. Every call goes
//  through `api`, so Bearer auth is injected automatically and the envelope
//  is unwrapped before the caller ever sees the response.
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

export const ticketApi = {
  list:   (params)   => api.get(`/tickets${buildQuery(params)}`),
  get:    (id)       => api.get(`/tickets/${id}`),
  create: (payload)  => api.post('/tickets', payload),
  update: (id, body) => api.patch(`/tickets/${id}`, body),
  remove: (id)       => api.delete(`/tickets/${id}`),
};

export default ticketApi;
