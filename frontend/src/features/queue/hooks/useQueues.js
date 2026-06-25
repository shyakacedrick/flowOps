// ============================================================================
//  useQueues — live queue list from the backend
// ----------------------------------------------------------------------------
//  Calls GET /api/queues once on mount and exposes { queues, status, error,
//  refresh }. Org-scoping is enforced server-side; this hook just trusts the
//  authenticated payload from queueApi.
//
//  Status state machine:
//    idle   → initial mount before fetch resolves
//    loading→ fetch in flight
//    ready  → fetch returned a queue array (possibly empty)
//    error  → fetch failed (network / 4xx / 5xx)
//
//  Polling: OFF by default. Live updates flow through SSE (see below). Pass
//  `pollMs: <number>` only as a fallback for environments where the SSE
//  channel is known to be blocked (some corporate proxies strip text/event-
//  stream). With multiple consumers of this hook on the same page, enabling
//  polling per-instance multiplies requests — prefer leaving it off and
//  trusting the live channel.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import queueApi from '@/services/queueApi.js';
import { useOrgEventStream } from '@/shared/hooks/useEventStream.js';

export function useQueues(params, { pollMs = 0 } = {}) {
  // Stabilize params by its serialized value so callers passing inline
  // objects (e.g. useQueues({}, ...)) don't trigger infinite re-fetches.
  // JSON.stringify is sufficient here — params is a small filter object.
  const paramsKey = useMemo(() => JSON.stringify(params || null), [params]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableParams = useMemo(() => params, [paramsKey]);

  const [queues, setQueues] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  // Track in-flight mutations so a poll response doesn't clobber an
  // optimistic placeholder mid-flight.
  const inflightRef = useRef(0);

  const fetchOnce = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setStatus('loading');
        setError(null);
      }
      let res;
      try {
        res = await queueApi.list(stableParams);
      } catch (err) {
        // Network failure / abort. The status MUST transition out of
        // 'loading' or the spinner spins forever.
        if (!silent) {
          setError(err?.message || 'Network error');
          setStatus('error');
        }
        return;
      }
      if (!res?.ok) {
        if (!silent) {
          setError(res?.message || 'Failed to load queues');
          setStatus('error');
        }
        return;
      }
      // Skip overwrite while a mutation is in flight — the next manual
      // refresh (or the next poll) will reconcile.
      if (inflightRef.current > 0) {
        if (!silent) setStatus('ready');
        return;
      }
      setQueues(Array.isArray(res.data) ? res.data : []);
      setStatus('ready');
    },
    [stableParams]
  );

  const refresh = useCallback(() => fetchOnce({ silent: false }), [fetchOnce]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // --- Polling -------------------------------------------------------------
  useEffect(() => {
    if (!pollMs || pollMs <= 0) return undefined;

    let timer = null;
    const tick = () => {
      if (document.visibilityState === 'visible') {
        fetchOnce({ silent: true });
      }
    };
    timer = setInterval(tick, pollMs);

    // Also re-fetch the moment the tab regains focus, so the user never
    // looks at stale data after switching back.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchOnce({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pollMs, fetchOnce]);

  // --- Live SSE updates -----------------------------------------------------
  // Polling stays on as a fallback (browsers behind proxies that strip SSE),
  // but when the live channel is connected the UI updates within tens of
  // milliseconds of a server-side change instead of waiting for the next tick.
  const stream = useOrgEventStream();
  useEffect(() => {
    const offCreated = stream.on('queue:created', (queue) => {
      if (!queue?._id) return;
      setQueues((prev) => {
        // Already have the real record? Just drop any matching optimistic placeholder.
        if (prev.some((q) => q._id === queue._id)) {
          return prev.filter((q) => !(q._optimistic && q._id.startsWith('temp:') && q.name === queue.name));
        }
        // First sighting — strip any matching optimistic placeholder, then prepend.
        const cleaned = prev.filter((q) => !(q._optimistic && q._id.startsWith('temp:') && q.name === queue.name));
        return [queue, ...cleaned];
      });
    });
    const offUpdated = stream.on('queue:updated', (queue) => {
      if (!queue?._id) return;
      setQueues((prev) => prev.map((q) => (q._id === queue._id ? queue : q)));
    });
    const offDeleted = stream.on('queue:deleted', ({ _id } = {}) => {
      if (!_id) return;
      setQueues((prev) => prev.filter((q) => q._id !== _id));
    });
    return () => {
      offCreated(); offUpdated(); offDeleted();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Optimistic mutators ---------------------------------------------------
  // These let callers update the local list immediately, without waiting for
  // a server round-trip. The caller is responsible for rolling back (calling
  // the inverse mutator) if the API request fails.
  //
  // Each optimistic mutator bumps `inflightRef` so concurrent polls don't
  // overwrite the local list mid-mutation. Callers MUST call `endMutation()`
  // (or rely on replaceQueue / rollbacks) when done.

  const beginMutation = useCallback(() => {
    inflightRef.current += 1;
  }, []);

  const endMutation = useCallback(() => {
    inflightRef.current = Math.max(0, inflightRef.current - 1);
  }, []);

  // Cleanup on unmount: reset inflightRef in case a mutation was in-flight
  useEffect(() => {
    return () => {
      inflightRef.current = 0;
    };
  }, []);

  const addQueueOptimistic = useCallback((queue) => {
    setQueues((prev) => [queue, ...prev]);
  }, []);

  const updateQueueOptimistic = useCallback((id, patch) => {
    setQueues((prev) =>
      prev.map((q) => (q._id === id ? { ...q, ...patch } : q))
    );
  }, []);

  const removeQueueOptimistic = useCallback((id) => {
    setQueues((prev) => prev.filter((q) => q._id !== id));
  }, []);

  // Swap an optimistic placeholder for the real server-issued record once
  // the create call resolves. If SSE already inserted the real record, we
  // just drop the placeholder to avoid a duplicate row. If response parsing
  // failed (real._id is missing), just remove the temp placeholder.
  const replaceQueue = useCallback((tempId, real) => {
    if (!real?._id) {
      // Response parsing failed - just remove the temp placeholder
      setQueues((prev) => prev.filter((q) => q._id !== tempId));
      return;
    }
    setQueues((prev) => {
      const realAlreadyPresent = prev.some((q) => q._id === real._id);
      if (realAlreadyPresent) {
        return prev.filter((q) => q._id !== tempId);
      }
      return prev.map((q) => (q._id === tempId ? real : q));
    });
  }, []);

  return {
    queues,
    status,
    error,
    refresh,
    beginMutation,
    endMutation,
    addQueueOptimistic,
    updateQueueOptimistic,
    removeQueueOptimistic,
    replaceQueue,
  };
}

export default useQueues;
