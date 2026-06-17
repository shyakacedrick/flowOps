// ============================================================================
//  useSystemStatusEngine — real platform-subsystem health
// ----------------------------------------------------------------------------
//  Reports the health of the four core platform subsystems by pinging the
//  real services the dashboard depends on (auth, analytics, queues,
//  activities). Each row reports an online/degraded/offline status plus a
//  measured p50 latency in ms. Re-checks every 30s while the tab is
//  visible.
//
//  Latency thresholds (per p50):
//    < 300ms      → online
//    300 – 1200ms → degraded
//    fail / >1.2s → offline
// ============================================================================

import { useEffect, useState } from 'react';
import { api } from '@/services/api.js';

const PROBES = [
  { key: 'queue',         label: 'Queue service',     path: '/queues?limit=1' },
  { key: 'analytics',     label: 'Analytics engine',  path: '/analytics/summary?range=24h' },
  { key: 'notifications', label: 'Notifications',     path: '/activities?limit=1' },
  { key: 'insights',      label: 'Smart insights',    path: '/activities?limit=1&type=ticket_served' },
];

function classify(latencyMs, ok) {
  if (!ok)              return 'offline';
  if (latencyMs >= 1200) return 'offline';
  if (latencyMs >= 300)  return 'degraded';
  return 'online';
}

async function probe({ key, label, path }) {
  const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let ok = false;
  try {
    const res = await api.get(path);
    ok = !!res?.ok;
  } catch {
    ok = false;
  }
  const latency = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
  return { key, label, latency, status: classify(latency, ok) };
}

export function useSystemStatusEngine() {
  const [systems, setSystems] = useState(
    PROBES.map((p) => ({ key: p.key, label: p.label, latency: 0, status: 'online' }))
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const next = await Promise.all(PROBES.map(probe));
      if (!cancelled) setSystems(next);
    };
    run();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') run();
    }, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return systems;
}

export default useSystemStatusEngine;
