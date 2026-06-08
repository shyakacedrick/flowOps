// ============================================================================
//  useActivities — backend activity log, polled every 5s
// ----------------------------------------------------------------------------
//  Read-only feed of Activity records (org-scoped server-side). Designed
//  for the staff Activity Feed + owner dashboard live feed panel.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import activityApi from '@/services/activityApi.js';

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

  return { activities, status, error, refresh };
}

export default useActivities;
