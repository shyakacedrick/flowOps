// ============================================================================
//  useSystemHealth — single source of truth for platform-subsystem health
// ----------------------------------------------------------------------------
//  Probes the 5 core API surfaces every 30s and shares the result with every
//  subscribed component (sidebar pill, system-monitoring page, etc.). One
//  timer + one in-flight probe regardless of how many consumers mount —
//  implemented via a module-level cache with a subscriber set.
//
//  Returned shape:
//    {
//      overall:    'operational' | 'degraded' | 'incident' | 'unknown',
//      components: [{ name, icon, latency, status }],
//      lastChecked: Date | null,
//      checking:   boolean,
//      recheck:    () => Promise<void>,
//    }
// ============================================================================

import { useEffect, useState } from 'react';
import { Server, Activity, Database, Bell, Lock } from 'lucide-react';
import { api } from '@/services/api.js';

const PROBES = [
  { name: 'API Gateway',          icon: Server,   path: '/auth/me' },
  { name: 'Queue Engine',         icon: Activity, path: '/queues?limit=1' },
  { name: 'Analytics Engine',     icon: Database, path: '/analytics/summary?range=24h' },
  { name: 'Notification Service', icon: Bell,     path: '/activities?limit=1' },
  { name: 'Authentication',       icon: Lock,     path: '/auth/me' },
];

const POLL_MS = 30_000;

function classify(latencyMs, ok) {
  if (!ok)               return 'incident';
  if (latencyMs >= 1200) return 'incident';
  if (latencyMs >= 400)  return 'degraded';
  return 'operational';
}

function computeOverall(components) {
  if (!components.length) return 'unknown';
  if (components.some((c) => c.status === 'incident'))  return 'incident';
  if (components.some((c) => c.status === 'degraded'))  return 'degraded';
  return 'operational';
}

async function probe({ name, icon, path }) {
  const t0 = performance.now();
  let ok = false;
  try {
    const res = await api.get(path);
    ok = !!res?.ok;
  } catch {
    ok = false;
  }
  const latency = Math.round(performance.now() - t0);
  return { name, icon, latency, status: classify(latency, ok) };
}

// ── Module-level singleton state ────────────────────────────────────────────
const state = {
  components: PROBES.map((p) => ({ name: p.name, icon: p.icon, latency: 0, status: 'operational' })),
  overall:    'unknown',
  lastChecked: null,
  checking:   false,
};
const subscribers = new Set();
let timerId = null;
let inFlight = null;

function notify() {
  for (const fn of subscribers) fn();
}

async function runProbes() {
  if (inFlight) return inFlight; // dedupe overlapping calls
  state.checking = true;
  notify();
  inFlight = (async () => {
    const next = await Promise.all(PROBES.map(probe));
    state.components  = next;
    state.overall     = computeOverall(next);
    state.lastChecked = new Date();
    state.checking    = false;
    notify();
  })();
  try { await inFlight; }
  finally { inFlight = null; }
}

function startTimerIfNeeded() {
  if (timerId != null) return;
  timerId = setInterval(() => {
    if (document.visibilityState === 'visible') runProbes();
  }, POLL_MS);
}

function stopTimerIfIdle() {
  if (subscribers.size > 0 || timerId == null) return;
  clearInterval(timerId);
  timerId = null;
}

// ── Hook ────────────────────────────────────────────────────────────────────
export default function useSystemHealth() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const sub = () => setTick((n) => n + 1);
    subscribers.add(sub);
    // Kick off an initial probe on first mount across the whole app.
    if (state.lastChecked == null && !state.checking) runProbes();
    startTimerIfNeeded();
    return () => {
      subscribers.delete(sub);
      stopTimerIfIdle();
    };
  }, []);

  return {
    overall:     state.overall,
    components:  state.components,
    lastChecked: state.lastChecked,
    checking:    state.checking,
    recheck:     runProbes,
  };
}
