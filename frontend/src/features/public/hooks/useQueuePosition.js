// ============================================================================
//  useQueuePosition — poll a public ticket for live status + line position
// ----------------------------------------------------------------------------
//  Used by the customer-facing join page after they've taken a ticket.
//  Polls every 5s while the document is visible and the ticket is still
//  waiting / serving. Stops polling once the ticket reaches a terminal
//  state (served / skipped / cancelled).
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import publicApi from '@/services/publicApi.js';

const TERMINAL_STATUSES = ['served', 'skipped', 'cancelled'];

export function useQueuePosition(ticketId, { pollMs = 5000 } = {}) {
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const stoppedRef = useRef(false);

  const fetchOnce = useCallback(
    async ({ silent = false } = {}) => {
      if (!ticketId) return;
      if (!silent) {
        setStatus('loading');
        setError(null);
      }
      const res = await publicApi.getTicket(ticketId);
      if (!res.ok) {
        if (!silent) {
          setError(res.message || 'Failed to load ticket status');
          setStatus('error');
        }
        return;
      }
      setTicket(res.data);
      setStatus('ready');
      if (TERMINAL_STATUSES.includes(res.data?.status)) {
        stoppedRef.current = true;
      }
    },
    [ticketId]
  );

  const refresh = useCallback(() => fetchOnce({ silent: false }), [fetchOnce]);

  useEffect(() => {
    stoppedRef.current = false;
    if (ticketId) refresh();
  }, [ticketId, refresh]);

  useEffect(() => {
    if (!ticketId || !pollMs || pollMs <= 0) return undefined;

    const tick = () => {
      if (stoppedRef.current) return;
      if (document.visibilityState === 'visible') fetchOnce({ silent: true });
    };
    const timer = setInterval(tick, pollMs);
    const onVisibility = () => {
      if (stoppedRef.current) return;
      if (document.visibilityState === 'visible') fetchOnce({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ticketId, pollMs, fetchOnce]);

  return { ticket, status, error, refresh };
}

export default useQueuePosition;
