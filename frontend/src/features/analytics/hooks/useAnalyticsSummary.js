// ============================================================================
//  useAnalyticsSummary — owner/admin operational metrics
// ----------------------------------------------------------------------------
//  Wraps GET /api/analytics/summary with visibility-aware polling. Mirrors
//  the pattern from useQueues / useTickets so the dashboard stays live
//  without flickering.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/services/api.js';

const VALID_RANGES = ['24h', '7d', '30d'];

export function useAnalyticsSummary({ range = '24h', pollMs = 30000 } = {}) {
  const normalizedRange = VALID_RANGES.includes(range) ? range : '24h';

  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const inflightRef = useRef(false);

  const fetchOnce = useCallback(
    async ({ silent = false } = {}) => {
      if (inflightRef.current) return;
      inflightRef.current = true;
      if (!silent) {
        setStatus('loading');
        setError(null);
      }
      const res = await api.get(`/analytics/summary?range=${encodeURIComponent(normalizedRange)}`);
      inflightRef.current = false;
      if (!res.ok) {
        if (!silent) {
          setError(res.message || 'Failed to load analytics');
          setStatus('error');
        }
        return;
      }
      setSummary(res.data);
      setStatus('ready');
    },
    [normalizedRange]
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

  return { summary, status, error, refresh, range: normalizedRange };
}

export default useAnalyticsSummary;
