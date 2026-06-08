// ============================================================================
//  activityController — read-only listing for Activity records
// ----------------------------------------------------------------------------
//  Only GET is exposed. Writes happen exclusively through activityService.js
//  inside other controllers (auth, queue, ticket, organization) so that the
//  log stays consistent and isn't tampered with from the API surface.
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import Activity, { ACTIVITY_TYPES } from '../models/Activity.js';
import { USER_ROLES } from '../models/User.js';

/**
 * Visibility rules (matches the org-scope pattern used in other controllers):
 *  - platform_admin sees all activity records
 *  - business_owner / staff see only their own organization's records
 */
const scopeFilter = (user, base = {}) => {
  if (user.role === USER_ROLES.PLATFORM_ADMIN) return base;
  if (!user.organizationId) return { ...base, _id: null };
  return { ...base, organizationId: user.organizationId };
};

/**
 * GET /api/activities
 * Optional filters:  ?type=ticket_created&limit=50
 * Always sorted newest-first; default & max limit 100.
 */
export const listActivities = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) {
    if (!Object.values(ACTIVITY_TYPES).includes(req.query.type)) {
      // Invalid type — return empty rather than 400, so a wrong client value
      // doesn't crash the feed UI.
      return success(res, []);
    }
    filter.type = req.query.type;
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

  const rows = await Activity.find(scopeFilter(req.user, filter))
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actorId', 'name email role');

  return success(res, rows);
});

export default { listActivities };
