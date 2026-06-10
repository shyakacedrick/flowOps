// ============================================================================
//  queueApi — Queue CRUD against the FlowOps backend
// ----------------------------------------------------------------------------
//  Mirrors backend/src/routes/queueRoutes.js. All endpoints require a bearer
//  token; the shared `api` client injects it from localStorage.
//
//  Endpoint shapes:
//    list()                   GET    /queues                       → Queue[]   (org-scoped)
//    list({status})           GET    /queues?status=…              → Queue[]   (org-scoped)
//    list({includeDeleted})   GET    /queues?includeDeleted=true   → Queue[]   (admin only)
//    get(id)                  GET    /queues/:id                   → Queue
//    create(body)             POST   /queues                       → Queue     (owner/admin)
//    update(id,body)          PATCH  /queues/:id                   → Queue     (owner/admin)
//    remove(id)               DELETE /queues/:id                   → 204       (owner/admin) — soft-delete
//    restore(id)              POST   /queues/:id/restore           → Queue     (admin only)
// ============================================================================

import { api } from '@/services/api.js';

export const queueApi = {
  list:    (params)        => api.get(`/queues${toQuery(params)}`),
  get:     (id)            => api.get(`/queues/${id}`),
  create:  (body)          => api.post('/queues', body),
  update:  (id, body)      => api.patch(`/queues/${id}`, body),
  remove:  (id)            => api.delete(`/queues/${id}`),
  restore: (id)            => api.post(`/queues/${id}/restore`),
};

function toQuery(params) {
  if (!params || typeof params !== 'object') return '';
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : '';
}

export default queueApi;
