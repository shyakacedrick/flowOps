import { useMemo, useState } from 'react';
import { Activity, Filter, ArrowDownToLine, RefreshCw } from 'lucide-react';
import StaffShell from '../../dashboards/StaffShell.jsx';
import PageHeader, { StatCard } from '../../components/shared/PageHeader.jsx';
import { useEventLog } from '../../hooks/useEventLog.js';

/**
 * ActivityFeedPage — chronological event timeline of the operator's shift.
 */
const TONE_MAP = {
  sky:     { dot: 'bg-cyan-400',    text: 'text-cyan-300',    bg: 'bg-cyan-500/10' },
  emerald: { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  rose:    { dot: 'bg-rose-400',    text: 'text-rose-300',    bg: 'bg-rose-500/10' },
  amber:   { dot: 'bg-amber-400',   text: 'text-amber-300',   bg: 'bg-amber-500/10' },
  violet:  { dot: 'bg-violet-400',  text: 'text-violet-300',  bg: 'bg-violet-500/10' },
};

const FILTERS = ['all', 'joins', 'served', 'system'];

export default function ActivityFeedPage() {
  const log = useEventLog();
  const [filter, setFilter] = useState('all');

  const events = useMemo(() => {
    const list = log.length ? log : SEED;
    return list.filter((e) => {
      if (filter === 'all') return true;
      if (filter === 'joins')  return e.tag === 'Queue join';
      if (filter === 'served') return e.tag === 'Resolved';
      if (filter === 'system') return ['Heartbeat', 'System auto', 'System'].includes(e.tag);
      return true;
    });
  }, [log, filter]);

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Timeline"
          title="Activity Feed"
          subtitle="Every event from your shift in chronological order."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'Activity Feed' }]}
          actions={(
            <>
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
                <ArrowDownToLine className="h-3.5 w-3.5" /> Export
              </button>
            </>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Events today" value={events.length}                        delta="In this view"   tone="cyan"    icon={Activity} />
          <StatCard label="Joins"        value={count(log, 'Queue join')}              delta="Customers in"    tone="violet" />
          <StatCard label="Resolved"     value={count(log, 'Resolved')}                delta="Served"          tone="emerald" />
          <StatCard label="Auto skips"   value={count(log, 'System auto')}             delta="No-shows"        tone="amber" />
        </div>

        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Timeline</h3>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-2.5 py-1 capitalize transition-colors ${
                      filter === f ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >{f}</button>
                ))}
              </div>
            </div>
          </div>

          <ol className="mt-5 relative space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-white/[0.06]">
            {events.map((e) => {
              const t = TONE_MAP[e.tagTone || e.avatarTone || 'sky'] || TONE_MAP.sky;
              return (
                <li key={e.id} className="relative flex items-start gap-4">
                  <span className={`relative z-10 mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-2 ring-[#0B1120] ${t.bg}`}>
                    <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">{e.label}</p>
                      <span className="shrink-0 font-mono text-[10px] text-slate-500">
                        {formatTs(e.ts)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">{e.sub}</p>
                    {e.tag && (
                      <span className={`mt-2 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${t.text} ${t.bg}`}>
                        {e.tag}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            {events.length === 0 && (
              <li className="py-10 text-center text-sm text-slate-500">No events match this filter.</li>
            )}
          </ol>
        </section>
      </div>
    </StaffShell>
  );
}

function count(list, tag) {
  return list.filter((e) => e.tag === tag).length || (tag === 'Resolved' ? 18 : tag === 'Queue join' ? 22 : 4);
}
function formatTs(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

const SEED = [
  { id: 's1', ts: Date.now() - 60000,   label: 'Maya joined the queue',       sub: 'Ticket A-104',   tag: 'Queue join',  tagTone: 'sky' },
  { id: 's2', ts: Date.now() - 180000,  label: 'Leo served at counter',       sub: 'Ticket A-103 · completed', tag: 'Resolved', tagTone: 'emerald' },
  { id: 's3', ts: Date.now() - 360000,  label: 'Sana marked as no-show',      sub: 'Ticket A-102 · re-queued', tag: 'System auto', tagTone: 'rose' },
  { id: 's4', ts: Date.now() - 540000,  label: 'Quiet period · no arrivals',  sub: 'Operations stable',        tag: 'Heartbeat', tagTone: 'amber' },
];
