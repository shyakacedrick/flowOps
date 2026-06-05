import { Activity, Server, Database, Bell, Lock, ShieldAlert, RefreshCw } from 'lucide-react';
import AdminLayout from '@/features/admin/components/AdminShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';

const STATUS_STYLE = {
  operational: { text: 'Operational', dot: 'bg-emerald-400', ring: 'ring-emerald-400/30', bg: 'bg-emerald-500/10', col: 'text-emerald-300' },
  degraded:    { text: 'Degraded',    dot: 'bg-amber-400',   ring: 'ring-amber-400/30',   bg: 'bg-amber-500/10',   col: 'text-amber-300' },
  incident:    { text: 'Incident',    dot: 'bg-rose-400',    ring: 'ring-rose-400/30',    bg: 'bg-rose-500/10',    col: 'text-rose-300' },
};

const COMPONENTS = [
  { name: 'API Gateway',          icon: Server,     status: 'operational', uptime: 99.998, latency: '38ms',  errors: '0.001%' },
  { name: 'Queue Engine',         icon: Activity,   status: 'operational', uptime: 99.991, latency: '12ms',  errors: '0.004%' },
  { name: 'Analytics Engine',     icon: Database,   status: 'degraded',    uptime: 99.86,  latency: '142ms', errors: '0.18%'  },
  { name: 'Notification Service', icon: Bell,       status: 'operational', uptime: 99.97,  latency: '54ms',  errors: '0.02%'  },
  { name: 'Authentication',       icon: Lock,       status: 'operational', uptime: 99.995, latency: '21ms',  errors: '0.001%' },
];

const LIVE_FEED = [
  { ts: '14:08:24', kind: 'info',    msg: 'Auto-scaled queue-engine to 14 nodes (+2)' },
  { ts: '14:06:11', kind: 'warn',    msg: 'Analytics engine p99 latency exceeded 150ms threshold' },
  { ts: '14:01:02', kind: 'success', msg: 'Notification service deploy v4.18.2 succeeded' },
  { ts: '13:54:38', kind: 'info',    msg: 'API gateway rotated TLS cert (no downtime)' },
  { ts: '13:42:09', kind: 'warn',    msg: 'Connection pool saturation on db-replica-3' },
  { ts: '13:30:47', kind: 'success', msg: 'Cache warm-up completed in 38s' },
  { ts: '13:21:14', kind: 'info',    msg: 'Heartbeat OK · all regions reachable' },
];

const KIND_DOT = { info: 'bg-cyan-400', warn: 'bg-amber-400', success: 'bg-emerald-400', error: 'bg-rose-400' };

export default function SystemMonitoring() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Infrastructure"
          title="System Monitoring"
          subtitle="Component health, uptime, latency, and real-time platform signals."
          crumbs={[{ label: 'Admin' }, { label: 'System Monitoring' }]}
          actions={(
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Overall health"  value="99.97%"  delta="30-day SLA: 99.95%"   tone="emerald" icon={Activity} />
          <StatCard label="Components"      value="5"        delta="4 healthy · 1 degraded" tone="cyan" />
          <StatCard label="P95 latency"     value="58ms"     delta="↓ 4ms vs LW"          tone="violet" />
          <StatCard label="Open incidents"  value="1"        delta="P3 · analytics-engine" tone="amber" icon={ShieldAlert} />
        </div>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-white">System components</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {COMPONENTS.map((c) => {
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
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                      <Metric label="Uptime"   value={`${c.uptime}%`} />
                      <Metric label="Latency"  value={c.latency} />
                      <Metric label="Error rate" value={c.errors} />
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
          <ul className="mt-4 space-y-1.5 font-mono text-xs">
            {LIVE_FEED.map((e, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-black/20 px-3 py-2">
                <span className="text-slate-500">{e.ts}</span>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[e.kind]}`} />
                <span className="text-slate-300">{e.msg}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminLayout>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-2 py-1">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="font-mono text-xs font-semibold text-white">{value}</p>
    </div>
  );
}
