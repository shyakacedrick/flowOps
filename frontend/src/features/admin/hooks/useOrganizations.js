// ============================================================================
//  useOrganizations — admin-scoped org list, polled
// ----------------------------------------------------------------------------
//  Wraps organizationApi.list(). Platform admins receive every org (the
//  controller scopeFilter returns {} for them). Polls slowly because org
//  metadata changes infrequently compared to live ops data.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import organizationApi from '@/services/organizationApi.js';

export function useOrganizations({ pollMs = 15000 } = {}) {
  const [organizations, setOrganizations] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError]   = useState(null);

  const fetchOnce = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setStatus('loading'); setError(null); }
    const res = await organizationApi.list();
    if (!res.ok) {
      if (!silent) {
        setError(res.message || 'Failed to load organizations');
        setStatus('error');
      }
      return;
    }
    setOrganizations(Array.isArray(res.data) ? res.data : []);
    setStatus('ready');
  }, []);

  const refresh = useCallback(() => fetchOnce({ silent: false }), [fetchOnce]);

  const update = useCallback(async (id, body) => {
    const res = await organizationApi.update(id, body);
    if (res.ok) {
      // Optimistically merge into local state so the row updates instantly;
      // a subsequent poll will reconcile any server-side computed fields.
      setOrganizations((prev) => prev.map((o) => (o._id === id ? { ...o, ...res.data } : o)));
    }
    return res;
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!pollMs || pollMs <= 0) return undefined;
    const tick = () => {
      if (document.visibilityState === 'visible') fetchOnce({ silent: true });
    };
    const timer = setInterval(tick, pollMs);
    return () => clearInterval(timer);
  }, [pollMs, fetchOnce]);

  return { organizations, status, error, refresh, update };
}

export default useOrganizations;
