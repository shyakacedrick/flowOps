// ============================================================================
//  usePlatformSettings — read + optimistic-patch the singleton settings doc
// ----------------------------------------------------------------------------
//  Renders the admin Settings page. PATCH applies the new value to local
//  state immediately and rolls back if the server rejects, so the UI feels
//  responsive even on Render's cold-start latency.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { platformSettingsApi } from '@/services/platformSettingsApi.js';

export default function usePlatformSettings() {
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState('idle');     // idle | loading | ready | error
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const inflightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    const res = await platformSettingsApi.get();
    inflightRef.current = false;
    if (!res.ok) {
      setError(res.message || 'Failed to load platform settings');
      setStatus('error');
      return;
    }
    setSettings(res.data);
    setError(null);
    setStatus('ready');
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /**
   * patch — optimistic update. `body` may contain top-level keys or a nested
   * `passwordPolicy` object; the backend merges shallow on top-level fields
   * and field-wise on passwordPolicy.
   *
   * Returns { ok, message? } so call-sites can show inline errors.
   */
  const patch = useCallback(async (body) => {
    if (!body || typeof body !== 'object') return { ok: false, message: 'Invalid update' };
    const previous = settings;
    // Optimistic merge mirroring the server's shallow + nested-passwordPolicy semantics.
    setSettings((cur) => {
      if (!cur) return cur;
      const next = { ...cur, ...body };
      if (body.passwordPolicy && typeof body.passwordPolicy === 'object') {
        next.passwordPolicy = { ...(cur.passwordPolicy || {}), ...body.passwordPolicy };
      }
      return next;
    });
    setSaving(true);
    const res = await platformSettingsApi.patch(body);
    setSaving(false);
    if (!res.ok) {
      // Roll back to the snapshot we captured before the patch.
      setSettings(previous);
      return { ok: false, message: res.message || 'Failed to save settings' };
    }
    // Server is the source of truth — overwrite with whatever it returned
    // so we pick up server-side normalisation (e.g. lowercased email).
    setSettings(res.data);
    return { ok: true };
  }, [settings]);

  return { settings, status, error, saving, refresh, patch };
}
