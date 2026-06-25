// ============================================================================
//  useTickets — live tickets for a single queue
// ----------------------------------------------------------------------------
//  Calls GET /api/tickets?queueId=... once on mount, then receives live
//  updates via SSE (see useOrgEventStream below). Polling is OFF by default;
//  pass `pollMs: <number>` only as a fallback when SSE is known to be
//  blocked. Mirrors the optimistic-mutator pattern from useQueues so
//  consuming components can update locally and reconcile via the next
//  refresh / SSE event.
//
//  Returns:
//    { tickets, status, error, refresh,
//      addOptimistic, updateOptimistic, removeOptimistic, replace,
//      beginMutation, endMutation }
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import ticketApi from '@/services/ticketApi.js';
import { useOrgEventStream } from '@/shared/hooks/useEventStream.js';

export function useTickets(queueId, { pollMs = 0, status } = {}) {
  const [tickets, setTickets] = useState([]);
  const [fetchStatus, setFetchStatus] = useState('idle');
  const [error, setError] = useState(null);
  const inflightRef = useRef(0);

  const fetchOnce = useCallback(
    async ({ silent = false } = {}) => {
      if (!queueId) {
        setTickets([]);
        setFetchStatus('ready');
        return;
      }
      if (!silent) {
        setFetchStatus('loading');
        setError(null);
      }
      let res;
      try {
        res = await ticketApi.list({ queueId, status });
      } catch (err) {
        if (!silent) {
          setError(err?.message || 'Network error');
          setFetchStatus('error');
        }
        return;
      }
      if (!res?.ok) {
        if (!silent) {
          setError(res?.message || 'Failed to load tickets');
          setFetchStatus('error');
        }
        return;
      }
      if (inflightRef.current > 0) {
        if (!silent) setFetchStatus('ready');
        return;
      }
      setTickets(Array.isArray(res.data) ? res.data : []);
      setFetchStatus('ready');
    },
    [queueId, status]
  );

  const refresh = useCallback(() => fetchOnce({ silent: false }), [fetchOnce]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // --- Polling -------------------------------------------------------------
  useEffect(() => {
    if (!queueId || !pollMs || pollMs <= 0) return undefined;

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
  }, [queueId, pollMs, fetchOnce]);

  // --- Live SSE updates ---------------------------------------------------
  // Each useTickets instance filters server events by its own queueId so
  // a dashboard rendering N queue consoles only updates the relevant lists.
  // `status` prop also filters — if the caller asked for waiting-only, we
  // drop tickets that have transitioned out of waiting.
  const stream = useOrgEventStream();
  useEffect(() => {
    if (!queueId) return undefined;
    const sameQueue = (t) => t && String(t.queueId) === String(queueId);
    const matchesStatusFilter = (t) => !status || t.status === status;

    const offCreated = stream.on('ticket:created', (t) => {
      if (!sameQueue(t) || !matchesStatusFilter(t)) return;
      setTickets((prev) => {
        // Already have the real ticket? Drop any matching optimistic row.
        if (prev.some((x) => x._id === t._id)) {
          return prev.filter((x) => !(x._optimistic && x._id.startsWith('temp:') && x.customerName === t.customerName));
        }
        // First sighting — strip any matching optimistic, then append.
        const cleaned = prev.filter((x) => !(x._optimistic && x._id.startsWith('temp:') && x.customerName === t.customerName));
        return [...cleaned, t];
      });
    });
    const offUpdated = stream.on('ticket:updated', (t) => {
      if (!sameQueue(t)) return;
      setTickets((prev) => {
        const idx = prev.findIndex((x) => x._id === t._id);
        // If a status filter is in effect and the ticket no longer matches,
        // remove it from the local list (e.g. waiting → serving in a
        // 'waiting' view).
        if (!matchesStatusFilter(t)) {
          return idx === -1 ? prev : prev.filter((x) => x._id !== t._id);
        }
        if (idx === -1) return [...prev, t];
        const next = prev.slice();
        next[idx] = t;
        return next;
      });
    });
    const offDeleted = stream.on('ticket:deleted', ({ _id, queueId: qid } = {}) => {
      if (qid && String(qid) !== String(queueId)) return;
      setTickets((prev) => prev.filter((x) => x._id !== _id));
    });
    return () => { offCreated(); offUpdated(); offDeleted(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueId, status]);

  // --- Mutators ------------------------------------------------------------
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

  const addOptimistic = useCallback((ticket) => {
    setTickets((prev) => [...prev, ticket]);
  }, []);

  const updateOptimistic = useCallback((id, patch) => {
    setTickets((prev) => prev.map((t) => (t._id === id ? { ...t, ...patch } : t)));
  }, []);

  const removeOptimistic = useCallback((id) => {
    setTickets((prev) => prev.filter((t) => t._id !== id));
  }, []);

  const replace = useCallback((tempId, real) => {
    if (!real?._id) {
      // Response parsing failed - just remove the temp placeholder
      setTickets((prev) => prev.filter((t) => t._id !== tempId));
      return;
    }
    setTickets((prev) => {
      const realAlreadyPresent = prev.some((t) => t._id === real._id);
      if (realAlreadyPresent) {
        return prev.filter((t) => t._id !== tempId);
      }
      return prev.map((t) => (t._id === tempId ? real : t));
    });
  }, []);

  return {
    tickets,
    status: fetchStatus,
    error,
    refresh,
    beginMutation,
    endMutation,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    replace,
  };
}

export default useTickets;
