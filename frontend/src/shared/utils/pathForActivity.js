// ============================================================================
//  pathForActivity — map an Activity item to the best destination route
// ----------------------------------------------------------------------------
//  Used by NotificationsMenu to make dropdown rows navigable. Routes differ
//  per role (e.g. owner queue page is '/live-queue', staff is '/staff/my-queue'),
//  so role is required.
//
//  Returns a path string, or null when the activity type has no obvious
//  destination — in which case the row stays non-clickable.
//
//  Why a single switch (vs. per-role maps)?
//    Most activity types route to the same conceptual page per role, just
//    under a different prefix. Keeping the logic in one place makes it easy
//    to keep behaviour consistent when new activity types are added.
// ============================================================================

import { ROUTES } from '@/shared/constants/routes.js';

export function pathForActivity(item, role) {
  if (!item || typeof item.type !== 'string') return null;

  switch (item.type) {
    // Queue lifecycle + ticket events → role's queue view.
    case 'queue_created':
    case 'queue_updated':
    case 'queue_deleted':
    case 'ticket_created':
    case 'ticket_serving':
    case 'ticket_served':
    case 'ticket_skipped':
    case 'ticket_cancelled':
      if (role === 'staff') return ROUTES.staff.myQueue;
      if (role === 'platform_admin') return ROUTES.admin.queues;
      return ROUTES.owner.liveQueue;

    // User events → admins go to user management. For owner/staff there's no
    // useful destination (your own login event → settings is misleading; a
    // stranger's login event is even less useful), so we keep the row static.
    case 'user_registered':
    case 'user_login':
      if (role === 'platform_admin') return ROUTES.admin.users;
      return null;

    // Org events → admins manage orgs; owners have no dedicated org page,
    // so leave the row static rather than dump them in settings.
    case 'organization_created':
      if (role === 'platform_admin') return ROUTES.admin.organizations;
      return null;

    default:
      return null;
  }
}

export default pathForActivity;
