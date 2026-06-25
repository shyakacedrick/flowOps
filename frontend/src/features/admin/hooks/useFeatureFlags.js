// ============================================================================
//  useFeatureFlags — admin CRUD for /api/admin/feature-flags
// ----------------------------------------------------------------------------
//  Read returns the full list; mutations apply optimistically and roll back
//  on failure. Mirrors the pattern in usePlatformSettings.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { featureFlagsApi } from '@/services/featureFlagsApi.js';

export default function useFeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const inflightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    const res = await featureFlagsApi.list();
    inflightRef.current = false;
    if (!res.ok) {
      setError(res.message || 'Failed to load feature flags');
      setStatus('error');
      return;
    }
    setFlags(Array.isArray(res.data) ? res.data : []);
    setError(null);
    setStatus('ready');
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /**
   * patch — optimistic update of a single flag. `key` is the immutable
   * machine-name; `body` is any subset of { enabled, stage, description }.
   */
  const patch = useCallback(async (key, body) => {
    const previous = flags;
    setFlags((cur) => cur.map((f) => (f.key === key ? { ...f, ...body } : f)));
    const res = await featureFlagsApi.patch(key, body);
    if (!res.ok) {
      setFlags(previous);
      return { ok: false, message: res.message || 'Failed to update flag' };
    }
    // Replace with server payload so we pick up updatedAt/updatedBy.
    setFlags((cur) => cur.map((f) => (f.key === key ? res.data : f)));
    return { ok: true };
  }, [flags]);

  const create = useCallback(async (body) => {
    const res = await featureFlagsApi.create(body);
    if (!res.ok) return { ok: false, message: res.message || 'Failed to create flag' };
    // Insert in sorted-by-key order so the UI stays stable.
    setFlags((cur) => [...cur, res.data].sort((a, b) => a.key.localeCompare(b.key)));
    return { ok: true, data: res.data };
  }, []);

  const remove = useCallback(async (key) => {
    const previous = flags;
    setFlags((cur) => cur.filter((f) => f.key !== key));
    const res = await featureFlagsApi.remove(key);
    if (!res.ok) {
      setFlags(previous);
      return { ok: false, message: res.message || 'Failed to delete flag' };
    }
    return { ok: true };
  }, [flags]);

  return { flags, status, error, refresh, patch, create, remove };
}
