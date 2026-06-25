// ============================================================================
//  useNotificationRules — admin CRUD for /api/admin/notification-rules
// ----------------------------------------------------------------------------
//  Same optimistic-patch shape as useFeatureFlags. Mutations roll back on
//  failure and replace with the server payload on success so updatedAt /
//  updatedBy stay current.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationRulesApi } from '@/services/notificationRulesApi.js';

export default function useNotificationRules() {
  const [rules, setRules]   = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError]   = useState(null);
  const inflightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    const res = await notificationRulesApi.list();
    inflightRef.current = false;
    if (!res.ok) {
      setError(res.message || 'Failed to load notification rules');
      setStatus('error');
      return;
    }
    setRules(Array.isArray(res.data) ? res.data : []);
    setError(null);
    setStatus('ready');
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const patch = useCallback(async (key, body) => {
    const previous = rules;
    setRules((cur) => cur.map((r) => (r.key === key ? { ...r, ...body } : r)));
    const res = await notificationRulesApi.patch(key, body);
    if (!res.ok) {
      setRules(previous);
      return { ok: false, message: res.message || 'Failed to update rule' };
    }
    setRules((cur) => cur.map((r) => (r.key === key ? res.data : r)));
    return { ok: true };
  }, [rules]);

  const create = useCallback(async (body) => {
    const res = await notificationRulesApi.create(body);
    if (!res.ok) return { ok: false, message: res.message || 'Failed to create rule' };
    setRules((cur) => [...cur, res.data].sort((a, b) => a.key.localeCompare(b.key)));
    return { ok: true, data: res.data };
  }, []);

  const remove = useCallback(async (key) => {
    const previous = rules;
    setRules((cur) => cur.filter((r) => r.key !== key));
    const res = await notificationRulesApi.remove(key);
    if (!res.ok) {
      setRules(previous);
      return { ok: false, message: res.message || 'Failed to delete rule' };
    }
    return { ok: true };
  }, [rules]);

  return { rules, status, error, refresh, patch, create, remove };
}
