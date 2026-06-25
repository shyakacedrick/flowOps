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

  /**
   * Upload a new logo. `file` is a browser File / Blob; the field name
   * MUST be 'logo' to match multer.single('logo') on the backend.
   */
  uploadLogo: (id, file) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post(`/organizations/${id}/logo`, fd);
  },
  removeLogo: (id) => api.delete(`/organizations/${id}/logo`),
};

export default organizationApi;
