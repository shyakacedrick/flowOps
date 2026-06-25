// ============================================================================
//  useActivities — backend activity log, polled every 5s
// ----------------------------------------------------------------------------
//  Read-only feed of Activity records (org-scoped server-side). Designed
//  for the staff Activity Feed + owner dashboard live feed panel.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import activityApi from '@/services/activityApi.js';
import { useOrgEventStream } from '@/shared/hooks/useEventStream.js';

export function useActivities({ limit = 50, type, actorId, pollMs = 5000 } = {}) {
  const [activities, setActivities] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const fetchOnce = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setStatus('loading');
        setError(null);
      }
      let res;
      try {
        res = await activityApi.list({ limit, type, actorId });
      } catch (err) {
        if (!silent) {
          setError(err?.message || 'Network error');
          setStatus('error');
        }
        return;
      }
      if (!res?.ok) {
        if (!silent) {
          setError(res?.message || 'Failed to load activities');
          setStatus('error');
        }
        return;
      }
      setActivities(Array.isArray(res.data) ? res.data : []);
      setStatus('ready');
    },
    [limit, type, actorId]
  );

  const refresh = useCallback(() => fetchOnce({ silent: false }), [fetchOnce]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!pollMs || pollMs <= 0) return undefined;
    const tick = () => {
      if (document.visibilityState === 'visible') fetchOnce({ silent: true });
    };
    const timer = setInterval(tick, pollMs);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchOnce({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pollMs, fetchOnce]);

  // --- Live SSE updates ---------------------------------------------------
  // Prepend new activity rows as they arrive. Respect the `type` filter,
  // the optional `actorId` filter, and the `limit` so the feed stays bounded.
  const stream = useOrgEventStream();
  useEffect(() => {
    const off = stream.on('activity:new', (activity) => {
      if (!activity?._id) return;
      if (type && activity.type !== type) return;
      if (actorId) {
        // actorId may arrive as a string (raw) or populated object.
        const incomingActorId = typeof activity.actorId === 'object'
          ? activity.actorId?._id
          : activity.actorId;
        if (String(incomingActorId) !== String(actorId)) return;
      }
      setActivities((prev) => {
        if (prev.some((a) => a._id === activity._id)) return prev;
        const next = [activity, ...prev];
        return next.length > limit ? next.slice(0, limit) : next;
      });
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, actorId, limit]);

  return { activities, status, error, refresh };
}

export default useActivities;
