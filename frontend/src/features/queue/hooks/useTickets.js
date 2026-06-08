// ============================================================================
//  useTickets — live tickets for a single queue
// ----------------------------------------------------------------------------
//  Calls GET /api/tickets?queueId=... and polls in the background (visibility-
//  aware). Mirrors the optimistic-mutator pattern from useQueues so consuming
//  components can update locally and reconcile via the next poll.
//
//  Returns:
//    { tickets, status, error, refresh,
//      addOptimistic, updateOptimistic, removeOptimistic, replace,
//      beginMutation, endMutation }
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import ticketApi from '@/services/ticketApi.js';

export function useTickets(queueId, { pollMs = 4000, status } = {}) {
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
      const res = await ticketApi.list({ queueId, status });
      if (!res.ok) {
        if (!silent) {
          setError(res.message || 'Failed to load tickets');
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

  // --- Mutators ------------------------------------------------------------
  const beginMutation = useCallback(() => {
    inflightRef.current += 1;
  }, []);
  const endMutation = useCallback(() => {
    inflightRef.current = Math.max(0, inflightRef.current - 1);
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
    setTickets((prev) => prev.map((t) => (t._id === tempId ? real : t)));
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
