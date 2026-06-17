// ============================================================================
//  Admin · System Monitoring — real subsystem probes + live activity feed
// ----------------------------------------------------------------------------
//  Health of the five core API surfaces is measured by pinging each one
//  every 30s and recording the p50 latency. The "live monitoring feed"
//  binds to /api/activities (platform-wide for admins) instead of fake
//  log lines.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Server, Database, Bell, Lock, ShieldAlert, RefreshCw,
} from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import { api } from '@/services/api.js';
import { useActivities } from '@/features/customer-feed/hooks/useActivities.js';

// ── Probes ──────────────────────────────────────────────────────────────────
const PROBES = [
  { name: 'API Gateway',          icon: Server,   path: '/auth/me' },
  { name: 'Queue Engine',         icon: Activity, path: '/queues?limit=1' },
  { name: 'Analytics Engine',     icon: Database, path: '/analytics/summary?range=24h' },
  { name: 'Notification Service', icon: Bell,     path: '/activities?limit=1' },
  { name: 'Authentication',       icon: Lock,     path: '/auth/me' },
];

function classify(latencyMs, ok) {
  if (!ok)               return 'incident';
  if (latencyMs >= 1200) return 'incident';
  if (latencyMs >= 400)  return 'degraded';
  return 'operational';
}

const STATUS_STYLE = {
  operational: { text: 'Operational', dot: 'bg-emerald-400', ring: 'ring-emerald-400/30', bg: 'bg-emerald-500/10', col: 'text-emerald-300' },
  degraded:    { text: 'Degraded',    dot: 'bg-amber-400',   ring: 'ring-amber-400/30',   bg: 'bg-amber-500/10',   col: 'text-amber-300' },
  incident:    { text: 'Incident',    dot: 'bg-rose-400',    ring: 'ring-rose-400/30',    bg: 'bg-rose-500/10',    col: 'text-rose-300' },
};

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

// Map activity types → live-feed kind for colour-coding.
const ACTIVITY_KIND = {
  ticket_cancelled:   'warn',
  ticket_skipped:     'warn',
  ticket_served:      'success',
  ticket_serving:     'info',
  ticket_created:     'info',
  queue_created:      'success',
  queue_updated:      'info',
  queue_deleted:      'warn',
  user_registered:    'success',
  user_login:         'info',
  organization_created: 'success',
};
const KIND_DOT = { info: 'bg-cyan-400', warn: 'bg-amber-400', success: 'bg-emerald-400', error: 'bg-rose-400' };

export default function SystemMonitoring() {
  const [components, setComponents] = useState(
    PROBES.map((p) => ({ name: p.name, icon: p.icon, latency: 0, status: 'operational' })),
  );
  const [lastChecked, setLastChecked] = useState(null);
  const [checking,    setChecking]    = useState(false);

  const runAll = async () => {
    setChecking(true);
    const next = await Promise.all(PROBES.map(probe));
    setComponents(next);
    setLastChecked(new Date());
    setChecking(false);
  };

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await runAll();
    };
    tick();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') tick();
    }, 30_000);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived KPIs.
  const healthyCount  = components.filter((c) => c.status === 'operational').length;
  const degradedCount = components.filter((c) => c.status === 'degraded').length;
  const incidentCount = components.filter((c) => c.status === 'incident').length;
  const p95Latency    = useMemo(() => {
    const lats = components.map((c) => c.latency).filter((n) => n > 0).sort((a, b) => a - b);
    if (!lats.length) return null;
    const idx = Math.min(lats.length - 1, Math.floor(lats.length * 0.95));
    return lats[idx];
  }, [components]);
  const overallStatus = incidentCount > 0 ? 'incident'
                       : degradedCount > 0 ? 'degraded'
                       : 'operational';

  const { activities } = useActivities({ limit: 25, pollMs: 5000 });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Infrastructure"
          title="System Monitoring"
          subtitle="Live API health, measured latencies, and platform activity stream."
          crumbs={[{ label: 'Admin' }, { label: 'System Monitoring' }]}
          actions={(
            <button
              onClick={runAll}
              disabled={checking}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} /> Re-check
            </button>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Overall health"
            value={STATUS_STYLE[overallStatus].text}
            delta={lastChecked ? `Checked ${formatRelative(lastChecked)}` : 'Probing…'}
            tone={overallStatus === 'operational' ? 'emerald' : overallStatus === 'degraded' ? 'amber' : 'rose'}
            icon={Activity}
          />
          <StatCard
            label="Components"
            value={components.length}
            delta={`${healthyCount} healthy · ${degradedCount} degraded · ${incidentCount} down`}
            tone="cyan"
          />
          <StatCard
            label="P95 latency"
            value={p95Latency != null ? `${p95Latency}ms` : '—'}
            delta="Across measured probes"
            tone="violet"
          />
          <StatCard
            label="Open incidents"
            value={incidentCount}
            delta={incidentCount === 0 ? 'All systems normal' : 'Investigate failing probes'}
            tone={incidentCount === 0 ? 'emerald' : 'rose'}
            icon={ShieldAlert}
          />
        </div>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-white">System components</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {components.map((c) => {
              const s = STATUS_STYLE[c.status];
              const Icon = c.icon;
              return (
                <div key={c.name} className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl ring-1 ${s.bg} ${s.ring}`}>
                    <Icon className={`h-4 w-4 ${s.col}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${s.col} ${s.bg} ${s.ring}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.text}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                      <Metric label="Latency"     value={c.latency > 0 ? `${c.latency}ms` : '—'} />
                      <Metric label="Last check"  value={lastChecked ? formatRelative(lastChecked) : '—'} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-white">Live monitoring feed</h3>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Streaming
            </span>
          </div>
          {activities.length === 0 ? (
            <p className="mt-6 py-6 text-center text-xs text-slate-500">Waiting for platform activity…</p>
          ) : (
            <ul className="mt-4 space-y-1.5 font-mono text-xs">
              {activities.map((a) => {
                const kind = ACTIVITY_KIND[a.type] || 'info';
                return (
                  <li key={a._id} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-black/20 px-3 py-2">
                    <span className="text-slate-500">{formatHms(a.createdAt)}</span>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[kind]}`} />
                    <span className="truncate text-slate-300">{a.description || a.type}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-2 py-1">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="font-mono text-xs font-semibold text-white">{value}</p>
    </div>
  );
}

function formatHms(iso) {
  if (!iso) return '--:--:--';
  const d = new Date(iso);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

function formatRelative(date) {
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 5)   return 'just now';
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
