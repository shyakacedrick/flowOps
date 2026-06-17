// ============================================================================
//  useEventLog — live, org-scoped activity log from the backend
// ----------------------------------------------------------------------------
//  Replaces the old simulation-derived log so legacy consumers
//  (LiveActivityFeedHybrid, ActivityFeedPage) render real customer / ticket
//  / queue activity instead of synthetic names.
//
//  Source : GET /api/activities (capped at LIMIT, polled at POLL_MS).
//  Shape  : compatible with the row shape both consumers already use:
//    { id, label, sub, name, tag, tagTone, avatarTone, ts, raw }
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider.jsx';
import activityApi from '@/services/activityApi.js';

const POLL_MS = 10_000;
const LIMIT   = 25;

const TYPE_META = {
  user_registered:      { tag: 'New user',     tagTone: 'emerald', avatarTone: 'emerald' },
  user_login:           { tag: 'Sign-in',      tagTone: 'violet',  avatarTone: 'violet'  },
  organization_created: { tag: 'Org created',  tagTone: 'violet',  avatarTone: 'violet'  },
  queue_created:        { tag: 'Queue',        tagTone: 'sky',     avatarTone: 'sky'     },
  queue_updated:        { tag: 'Queue update', tagTone: 'sky',     avatarTone: 'sky'     },
  queue_deleted:        { tag: 'Queue',        tagTone: 'rose',    avatarTone: 'rose'    },
  ticket_created:       { tag: 'Queue join',   tagTone: 'sky',     avatarTone: 'sky'     },
  ticket_serving:       { tag: 'Serving',      tagTone: 'amber',   avatarTone: 'amber'   },
  ticket_served:        { tag: 'Resolved',     tagTone: 'emerald', avatarTone: 'emerald' },
  ticket_skipped:       { tag: 'System auto',  tagTone: 'rose',    avatarTone: 'rose'    },
  ticket_cancelled:     { tag: 'Cancelled',    tagTone: 'rose',    avatarTone: 'rose'    },
};

/**
 * Builds a sub-line from activity metadata + description. Returns '' when no
 * useful structured data is available (no fabricated placeholder text).
 */
function subOf(a) {
  if (a.description?.includes('#')) {
    const match = a.description.match(/#([A-Za-z0-9-]+)/);
    if (match) return `Ticket ${match[1]}`;
  }
  if (a.type?.startsWith('queue_')) return 'Queue activity';
  if (a.type?.startsWith('user_'))  return 'Account activity';
  return '';
}

function toRow(a) {
  const meta = TYPE_META[a.type] || { tag: 'Activity', tagTone: 'sky', avatarTone: 'sky' };
  return {
    id: a._id,
    label: a.description,
    sub: subOf(a),
    name: a.actorId?.name || 'System',
    tag: meta.tag,
    tagTone: meta.tagTone,
    avatarTone: meta.avatarTone,
    ts: new Date(a.createdAt).getTime(),
    raw: a,
  };
}

/**
 * Returns a rolling log of recent activity (newest first, capped at LIMIT).
 * Returns an empty array when the user is signed out or before the first
 * fetch resolves — consumers should render an EmptyState in that case.
 */
export function useEventLog() {
  const { session } = useAuth();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!session) {
      setActivities([]);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      const res = await activityApi.list({ limit: LIMIT });
      if (cancelled || !res.ok) return;
      setActivities(Array.isArray(res.data) ? res.data : []);
    };
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [session]);

  return useMemo(() => activities.map(toRow), [activities]);
}

export default useEventLog;
