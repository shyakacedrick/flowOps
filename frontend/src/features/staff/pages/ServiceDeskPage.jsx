// ============================================================================
//  ServiceDeskPage — operator workstation view, wired to real data
// ----------------------------------------------------------------------------
//  Workstation status, current-customer panel, and live shift KPIs derived
//  from /api/analytics/summary and the live SSE stream. No simulation,
//  no synthetic names, no fabricated hardware metrics.
// ============================================================================

import { useEffect, useState } from 'react';
import {
  MonitorCog, Play, Pause, AlertCircle, AlertTriangle, CheckCircle2, Coffee,
  Activity,
} from 'lucide-react';
import StaffShell from '@/features/staff/components/StaffShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import useAnalyticsSummary from '@/features/analytics/hooks/useAnalyticsSummary.js';
import useQueues from '@/features/queue/hooks/useQueues.js';
import { useOrgEventStream } from '@/shared/hooks/useEventStream.js';
import ticketApi from '@/services/ticketApi.js';

export default function ServiceDeskPage() {
  const { summary } = useAnalyticsSummary({ range: '24h', pollMs: 30_000 });
  const { queues }  = useQueues();
  const [serving, setServing] = useState(null);
  const [paused, setPaused]   = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Pull the latest serving ticket across all queues (one operator → one
  // active customer at a time). Re-runs whenever the queue list changes.
  useEffect(() => {
    if (!queues.length) {
      setServing(null);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      const results = await Promise.all(
        queues.map((q) => ticketApi.list({ queueId: q._id, status: 'serving' })),
      );
      if (cancelled) return;
      const merged = results
        .filter((r) => r.ok && Array.isArray(r.data))
        .flatMap((r) => r.data)
        .sort((a, b) => new Date(b.updatedAt || b.joinedAt) - new Date(a.updatedAt || a.joinedAt));
      setServing(merged[0] || null);
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [queues]);

  // Live SSE: update the displayed serving ticket as it changes status.
  const stream = useOrgEventStream();
  useEffect(() => {
    const off1 = stream.on('ticket:updated', (t) => {
      if (!t) return;
      if (t.status === 'serving') {
        setServing((cur) => (cur && cur._id === t._id ? t : t));
      } else if (serving && serving._id === t._id) {
        setServing(null);
      }
    });
    return off1;
  }, [stream, serving]);

  // Elapsed-time ticker on the active customer.
  useEffect(() => {
    setElapsed(0);
    if (!serving) return undefined;
    const startedAt = new Date(serving.updatedAt || serving.joinedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [serving?._id]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  const servedToday = summary?.totals?.served ?? 0;
  const avgServiceMins = summary?.avgServiceMins != null
    ? `${Math.round(summary.avgServiceMins)}m`
    : '—';

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Workstation"
          title="Service Desk"
          subtitle="Manage your station and signal capacity to the floor."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'Service Desk' }]}
          actions={(
            <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold ring-1 ${
              paused ? 'bg-amber-500/10 text-amber-200 ring-amber-400/30'
                     : 'bg-emerald-500/10 text-emerald-200 ring-emerald-400/30'
            }`}>
              <span className={`h-2 w-2 rounded-full ${paused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              {paused ? 'Paused' : 'Active'}
            </div>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Served (24h)" value={servedToday}     delta="Org-wide"     tone="emerald" icon={CheckCircle2} />
          <StatCard label="Avg service"  value={avgServiceMins} delta="Per customer" tone="cyan"    icon={Activity} />
          <StatCard label="Current"      value={serving ? `#${serving.ticketNumber}` : '—'} delta={serving?.customerName || 'Idle'} tone="violet" icon={MonitorCog} />
          <StatCard label="Waiting"      value={summary?.totals?.waitingNow ?? 0}  delta="Across queues" tone="amber" />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          {/* Current customer + controls */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-7">
            <h3 className="text-sm font-semibold text-white">Current customer</h3>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.05] p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-300">Now serving</p>
                <p className="mt-1 text-2xl font-bold text-white">{serving?.customerName || 'No active customer'}</p>
                <p className="mt-0.5 font-mono text-sm text-slate-400">
                  {serving ? `#${serving.ticketNumber}` : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Duration</p>
                <p className="mt-1 font-mono text-3xl font-bold text-cyan-200">{mm}:{ss}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DeskBtn icon={paused ? Play : Pause} tone={paused ? 'emerald' : 'amber'}
                label={paused ? 'Resume desk' : 'Pause desk'}
                onClick={() => setPaused((p) => !p)} />
              <DeskBtn icon={Coffee} tone="cyan" label="Take a break"
                onClick={() => setPaused(true)} />
              <DeskBtn icon={AlertCircle} tone="violet" label="Request help"
                onClick={() => alert('Floor manager paged (coming soon)')} />
              <DeskBtn icon={AlertTriangle} tone="rose" label="Report issue"
                onClick={() => alert('Issue reporting (coming soon)')} />
            </div>
          </section>

          {/* Shift overview — pulls real org-wide numbers */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-5">
            <h3 className="text-sm font-semibold text-white">Shift overview</h3>
            <p className="text-xs text-slate-400">Last 24 hours, organisation-wide</p>

            <ul className="mt-4 space-y-3 text-sm">
              <OverviewRow label="Joined"        value={summary?.totals?.joined ?? 0} />
              <OverviewRow label="Served"        value={summary?.totals?.served ?? 0} />
              <OverviewRow label="Skipped"       value={summary?.totals?.skipped ?? 0} />
              <OverviewRow label="Cancelled"     value={summary?.totals?.cancelled ?? 0} />
              <OverviewRow label="Abandon rate"  value={summary?.abandonRate != null ? `${summary.abandonRate}%` : '—'} />
              <OverviewRow label="Avg wait"      value={summary?.avgWaitMins != null ? `${Math.round(summary.avgWaitMins)}m` : '—'} />
            </ul>
          </section>
        </div>
      </div>
    </StaffShell>
  );
}

const TONES = {
  emerald: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30 hover:bg-emerald-500/25',
  cyan:    'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30 hover:bg-cyan-500/25',
  amber:   'bg-amber-500/15 text-amber-200 ring-amber-400/30 hover:bg-amber-500/25',
  violet:  'bg-violet-500/15 text-violet-200 ring-violet-400/30 hover:bg-violet-500/25',
  rose:    'bg-rose-500/15 text-rose-200 ring-rose-400/30 hover:bg-rose-500/25',
};

function DeskBtn({ icon: Icon, tone, label, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 text-xs font-semibold ring-1 transition-all hover:-translate-y-0.5 active:translate-y-0 ${TONES[tone]}`}>
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function OverviewRow({ label, value }) {
  return (
    <li className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="font-semibold text-white tabular-nums">{value}</span>
    </li>
  );
}
