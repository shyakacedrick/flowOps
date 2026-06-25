// ============================================================================
//  useSubscriptions — admin list + per-row PATCH for /api/admin/subscriptions
// ----------------------------------------------------------------------------
//  The list endpoint returns subscriptions joined with their organization
//  plus a `meta` summary block (totalOrganizations, mrrCents, planCounts,
//  statusCounts). PATCH upserts a row so synthetic placeholder entries
//  (for orgs without a Subscription doc yet) become real on first edit.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { subscriptionsApi } from '@/services/subscriptionsApi.js';

const EMPTY_META = {
  totalOrganizations: 0,
  totalSubscriptions: 0,
  mrrCents:           0,
  currency:           'USD',
  planCounts:         {},
  statusCounts:       {},
};

export default function useSubscriptions({ pollMs = 60_000 } = {}) {
  const [items, setItems]   = useState([]);
  const [meta,  setMeta]    = useState(EMPTY_META);
  const [status, setStatus] = useState('idle');
  const [error, setError]   = useState(null);
  const inflightRef = useRef(false);

  const fetchOnce = useCallback(async ({ silent = false } = {}) => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    if (!silent) setStatus((s) => (s === 'ready' ? s : 'loading'));
    const res = await subscriptionsApi.list();
    inflightRef.current = false;
    if (!res.ok) {
      if (!silent) {
        setError(res.message || 'Failed to load subscriptions');
        setStatus('error');
      }
      return;
    }
    setItems(Array.isArray(res.data) ? res.data : []);
    setMeta(res.meta || EMPTY_META);
    setError(null);
    setStatus('ready');
  }, []);

  const refresh = useCallback(() => fetchOnce({ silent: false }), [fetchOnce]);

  useEffect(() => { fetchOnce({ silent: false }); }, [fetchOnce]);

  useEffect(() => {
    if (!pollMs || pollMs <= 0) return undefined;
    const tick = () => {
      if (document.visibilityState === 'visible') fetchOnce({ silent: true });
    };
    const timer = setInterval(tick, pollMs);
    return () => clearInterval(timer);
  }, [pollMs, fetchOnce]);

  /**
   * patch — upsert one subscription. We re-fetch the full list afterwards
   * so the aggregate `meta` (MRR, counts) is recomputed by the server
   * rather than re-derived twice. The call returns immediately with a
   * lightweight ok/message envelope; UI components can show a spinner.
   */
  const patch = useCallback(async (orgId, body) => {
    const res = await subscriptionsApi.patch(orgId, body);
    if (!res.ok) {
      return { ok: false, message: res.message || 'Failed to update subscription' };
    }
    await fetchOnce({ silent: true });
    return { ok: true, data: res.data };
  }, [fetchOnce]);

  return { items, meta, status, error, refresh, patch };
}
