// ============================================================================
//  platformSettingsApi — platform-wide configuration (admin only)
// ----------------------------------------------------------------------------
//  Backed by GET/PATCH /api/admin/settings. The backend stores a single
//  document; both methods always return the full settings object.
// ============================================================================

import { api } from '@/services/api.js';

export const platformSettingsApi = {
  get:   ()        => api.get('/admin/settings'),
  patch: (body)    => api.patch('/admin/settings', body),
};

export default platformSettingsApi;
