// ============================================================================
//  useActivities — backend activity log, polled every 5s
// ----------------------------------------------------------------------------
//  Read-only feed of Activity records (org-scoped server-side). Designed
//  for the staff Activity Feed + owner dashboard live feed panel.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import activityApi from '@/services/activityApi.js';
import { useOrgEventStream } from '@/shared/hooks/useEventStream.js';

export function useActivities({ limit = 50, type, pollMs = 5000 } = {}) {
  const [activities, setActivities] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const fetchOnce = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setStatus('loading');
        setError(null);
      }
      const res = await activityApi.list({ limit, type });
      if (!res.ok) {
        if (!silent) {
          setError(res.message || 'Failed to load activities');
          setStatus('error');
        }
        return;
      }
      setActivities(Array.isArray(res.data) ? res.data : []);
      setStatus('ready');
    },
    [limit, type]
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
  // Prepend new activity rows as they arrive. Respect the `type` filter and
  // the `limit` so the feed stays bounded.
  const stream = useOrgEventStream();
  useEffect(() => {
    const off = stream.on('activity:new', (activity) => {
      if (!activity?._id) return;
      if (type && activity.type !== type) return;
      setActivities((prev) => {
        if (prev.some((a) => a._id === activity._id)) return prev;
        const next = [activity, ...prev];
        return next.length > limit ? next.slice(0, limit) : next;
      });
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, limit]);

  return { activities, status, error, refresh };
}

export default useActivities;
