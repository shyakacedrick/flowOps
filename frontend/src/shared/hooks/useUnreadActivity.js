// ============================================================================
//  useUnreadActivity — live activity polling + per-user unread tracking
// ----------------------------------------------------------------------------
//  Shared by NotificationsMenu (which renders the dropdown) and any sidebar /
//  nav element that wants to show a live unread badge (e.g. StaffShell's
//  "Notifications" item).
//
//  Why localStorage (vs a server-side read marker)?
//    The Activity collection is an immutable audit log, not a notifications
//    table. Storing per-user read markers on the server would require a new
//    collection. localStorage matches what users expect (per-device read
//    state) and keeps the demo simple.
//
//  Returned shape:
//    {
//      items:        Activity[]   — newest first, capped at FETCH_LIMIT
//      count:        number       — unread count (items.createdAt > lastSeen)
//      loading:      boolean      — true while a fetch is in flight
//      error:        string|null  — last fetch error message
//      refetch:      () => void   — manually trigger a refresh
//      markAllRead:  () => void   — advance lastSeen to newest item
//    }
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider.jsx';
import activityApi from '@/services/activityApi.js';

const POLL_INTERVAL_MS = 60_000;
const FETCH_LIMIT = 8;

export function useUnreadActivity() {
  const { session } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Per-user, per-device read marker. Keying by userId means switching
  // accounts on the same machine doesn't inherit someone else's read state.
  const storageKey = session?.userId ? `flowops:notif:lastSeen:${session.userId}` : null;
  const [lastSeen, setLastSeen] = useState(() => {
    if (!storageKey || typeof window === 'undefined') return 0;
    const raw = window.localStorage.getItem(storageKey);
    return raw ? Number(raw) || 0 : 0;
  });

  // Reload marker when the active account changes.
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(storageKey);
    setLastSeen(raw ? Number(raw) || 0 : 0);
  }, [storageKey]);

  const refetch = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const res = await activityApi.list({ limit: FETCH_LIMIT });
    setLoading(false);
    if (!res.ok) {
      setError(res.message || 'Could not load notifications.');
      return;
    }
    setError(null);
    setItems(Array.isArray(res.data) ? res.data : []);
  }, [session]);

  // Initial fetch + background polling.
  useEffect(() => {
    if (!session) return undefined;
    refetch();
    const id = setInterval(refetch, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [session, refetch]);

  const count = items.reduce((n, it) => {
    const ts = new Date(it.createdAt).getTime();
    return ts > lastSeen ? n + 1 : n;
  }, 0);

  const markAllRead = useCallback(() => {
    if (items.length === 0) return;
    const newest = items.reduce((max, it) => {
      const ts = new Date(it.createdAt).getTime();
      return ts > max ? ts : max;
    }, 0);
    setLastSeen(newest);
    if (storageKey && typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, String(newest));
    }
  }, [items, storageKey]);

  return { items, count, loading, error, refetch, markAllRead };
}

export default useUnreadActivity;
