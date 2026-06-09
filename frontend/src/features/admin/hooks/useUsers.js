// ============================================================================
//  useUsers — admin-scoped cross-tenant user list, polled
// ----------------------------------------------------------------------------
//  Backed by /api/users (platform_admin only). Supports server-side filters
//  for role/org/suspended and a client-side search box on top.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import usersApi from '@/services/usersApi.js';

export function useUsers({ pollMs = 20000, ...filters } = {}) {
  const [users, setUsers]   = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError]   = useState(null);

  // Serialise filters so the effect dep array is stable.
  const filterKey = JSON.stringify(filters);

  const fetchOnce = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setStatus('loading'); setError(null); }
    const res = await usersApi.list(filters);
    if (!res.ok) {
      if (!silent) {
        setError(res.message || 'Failed to load users');
        setStatus('error');
      }
      return;
    }
    setUsers(Array.isArray(res.data) ? res.data : []);
    setStatus('ready');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const refresh = useCallback(() => fetchOnce({ silent: false }), [fetchOnce]);

  const update = useCallback(async (id, body) => {
    const res = await usersApi.update(id, body);
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...res.data } : u)));
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

  return { users, status, error, refresh, update };
}

export default useUsers;
