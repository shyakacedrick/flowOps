// ============================================================================
//  activityApi — REST wrapper for /api/activities (read-only)
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

export const activityApi = {
  list: (params) => api.get(`/activities${buildQuery(params)}`),
};

export default activityApi;
