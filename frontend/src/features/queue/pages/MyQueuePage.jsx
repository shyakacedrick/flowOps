// ============================================================================
//  MyQueuePage — staff operator console wired to real backend tickets
// ----------------------------------------------------------------------------
//  Owner of the staff "/staff/my-queue" route. All data comes from the real
//  REST + SSE pipeline (useQueues / useTickets / ticketApi). No simulation.
//
//  Workflow
//    • Pick a queue (defaults to the first ACTIVE org queue).
//    • Stats are derived from live tickets + the analytics summary
//      (avg wait window).
//    • "Now serving" displays the most recent SERVING ticket in the
//      selected queue.
//    • Call / Served / Skip mutate the ticket status via
//      ticketApi.update — optimistic UI, reconciled by SSE.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import {
  PhoneCall, CheckCircle2, SkipForward, RotateCcw,
  Clock, Users, Search, Filter, AlertTriangle, Loader2,
} from 'lucide-react';
import StaffShell from '@/features/staff/components/StaffShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import LiveTicketsCard from '@/features/queue/components/LiveTicketsCard.jsx';
import useQueues from '@/features/queue/hooks/useQueues.js';
import useTickets from '@/features/queue/hooks/useTickets.js';
import useAnalyticsSummary from '@/features/analytics/hooks/useAnalyticsSummary.js';
import ticketApi from '@/services/ticketApi.js';

const STATUS = {
  WAITING:   'waiting',
  SERVING:   'serving',
  SERVED:    'served',
  SKIPPED:   'skipped',
  CANCELLED: 'cancelled',
};

export default function MyQueuePage() {
  const { queues, status: queuesStatus } = useQueues(undefined, { pollMs: 30_000 });
  const activeQueues = useMemo(
    () => queues.filter((q) => q.status === 'active' || !q.status),
    [queues],
  );

  const [queueId, setQueueId] = useState(null);
  useEffect(() => {
    if (queueId && activeQueues.some((q) => q._id === queueId)) return;
    setQueueId(activeQueues[0]?._id || null);
  }, [activeQueues, queueId]);

  const {
    tickets,
    refresh,
    updateOptimistic,
    beginMutation,
    endMutation,
  } = useTickets(queueId, { pollMs: 30_000 });

  const { summary } = useAnalyticsSummary({ range: '24h', pollMs: 30_000 });
  const avgWaitMins = Math.round(summary?.avgWaitMins ?? 0);

  const [filter, setFilter] = useState('all');
  const [query, setQuery]   = useState('');
  const [busyId, setBusyId] = useState(null);

  const waiting = useMemo(
    () => tickets
      .filter((t) => t.status === STATUS.WAITING)
      .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt)),
    [tickets],
  );
  const serving = useMemo(
    () => tickets
      .filter((t) => t.status === STATUS.SERVING)
      .sort((a, b) => new Date(b.updatedAt || b.joinedAt) - new Date(a.updatedAt || a.joinedAt)),
    [tickets],
  );
  const servedToday = useMemo(
    () => tickets.filter((t) => t.status === STATUS.SERVED).length,
    [tickets],
  );

  const current  = serving[0] || null;
  const filtered = useMemo(() => waiting.filter((t) => {
    if (filter === 'priority' && !/^V-/.test(t.ticketNumber)) return false;
    if (query && !`${t.ticketNumber} ${t.customerName}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [waiting, filter, query]);

  const estWait = Math.round((waiting.length || 0) * Math.max(1, avgWaitMins || 1) / 1);

  const mutateStatus = async (ticket, nextStatus) => {
    if (!ticket || busyId) return;
    setBusyId(ticket._id);
    beginMutation();
    const prevStatus = ticket.status;
    updateOptimistic(ticket._id, { status: nextStatus, servedAt: nextStatus === STATUS.SERVED ? new Date().toISOString() : ticket.servedAt });
    const res = await ticketApi.update(ticket._id, { status: nextStatus });
    endMutation();
    setBusyId(null);
    if (!res.ok) {
      updateOptimistic(ticket._id, { status: prevStatus });
      // eslint-disable-next-line no-alert
      alert(res.message || 'Failed to update ticket');
      refresh();
    }
  };

  const callNext = () => {
    const next = waiting[0];
    if (!next) return;
    mutateStatus(next, STATUS.SERVING);
  };

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Live workspace"
          title="My Queue"
          subtitle="Call, serve, skip — your live operational console."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'My Queue' }]}
          actions={(
            <QueuePicker
              queues={activeQueues}
              value={queueId}
              onChange={setQueueId}
              loading={queuesStatus === 'loading'}
            />
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="In queue"     value={waiting.length}      delta="Waiting now"   tone="cyan"    icon={Users} />
          <StatCard label="Avg wait"     value={`${avgWaitMins || 0}m`} delta="Last 24h"   tone="amber"   icon={Clock} />
          <StatCard label="Est. wait"    value={`${estWait}m`}       delta="Last in line"  tone="violet" />
          <StatCard label="Served today" value={servedToday}         delta="This queue"    tone="emerald" icon={CheckCircle2} />
        </div>

        {queuesStatus === 'ready' && activeQueues.length === 0 ? (
          <NoQueuesEmpty />
        ) : (
          <div className="grid gap-5 xl:grid-cols-12">
            <NowServing
              current={current}
              busyId={busyId}
              onServe={(t) => mutateStatus(t, STATUS.SERVED)}
              onSkip={(t)  => mutateStatus(t, STATUS.SKIPPED)}
              onCallNext={callNext}
              hasWaiting={waiting.length > 0}
            />
            <QueueList
              queue={filtered}
              allCount={waiting.length}
              busyId={busyId}
              onCall={(t)  => mutateStatus(t, STATUS.SERVING)}
              onServe={(t) => mutateStatus(t, STATUS.SERVED)}
              onSkip={(t)  => mutateStatus(t, STATUS.SKIPPED)}
              filter={filter} setFilter={setFilter}
              query={query} setQuery={setQuery}
            />
          </div>
        )}

        <LiveTicketsCard
          title="All live tickets"
          subtitle="Real data from /api/tickets · org-scoped · live via SSE"
        />
      </div>
    </StaffShell>
  );
}

// ---------------------------------------------------------------------------

function QueuePicker({ queues, value, onChange, loading }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading queues…
      </span>
    );
  }
  if (!queues.length) return null;
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
    >
      {queues.map((q) => (
        <option key={q._id} value={q._id} className="bg-slate-900">
          {q.name}
        </option>
      ))}
    </select>
  );
}

function NoQueuesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.08] py-16 text-center">
      <Filter className="h-7 w-7 text-slate-600" />
      <p className="mt-4 text-base font-semibold text-slate-200">No active queues</p>
      <p className="mt-1 max-w-md text-xs text-slate-500">
        Ask your owner to create or activate a queue in <span className="text-slate-300">Settings → Queues</span>.
        Once a queue is live, tickets will appear here in real time.
      </p>
    </div>
  );
}

function NowServing({ current, busyId, onServe, onSkip, onCallNext, hasWaiting }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    if (!current) return undefined;
    const startedAt = new Date(current.updatedAt || current.joinedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [current?._id]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const isBusy = busyId && current && busyId === current._id;

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.06] via-white/[0.02] to-blue-500/[0.04] p-5 xl:col-span-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-300">Now serving</p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            {current?.customerName || 'No customer'}
          </h2>
          <p className="mt-0.5 font-mono text-sm text-slate-400">
            {current ? `#${current.ticketNumber}` : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Service time</p>
          <p className="mt-1 font-mono text-3xl font-bold text-white">{mm}:{ss}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <ActionButton
          tone="emerald" icon={CheckCircle2} label="Served"
          disabled={!current || isBusy}
          onClick={() => onServe(current)}
        />
        <ActionButton
          tone="cyan" icon={PhoneCall} label="Call next"
          disabled={!hasWaiting || !!busyId}
          onClick={onCallNext}
        />
        <ActionButton
          tone="amber" icon={SkipForward} label="Skip"
          disabled={!current || isBusy}
          onClick={() => onSkip(current)}
        />
      </div>

      <button
        disabled={!current}
        onClick={() => alert('Recall: pinging customer (coming soon)')}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[0.08] disabled:opacity-40"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Recall customer
      </button>
    </section>
  );
}

function QueueList({ queue, allCount, busyId, onCall, onServe, onSkip, filter, setFilter, query, setQuery }) {
  return (
    <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 xl:col-span-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Up next</h3>
          <p className="text-xs text-slate-400">{queue.length} of {allCount} customers</p>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
          <div className="relative flex-1 sm:max-w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ticket / name"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-7 pr-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
            />
          </div>
          <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-0.5 text-[11px] font-semibold">
            {['all', 'priority'].map((f) => (
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

      {queue.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] py-12 text-center">
          <Filter className="h-6 w-6 text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-slate-200">No customers waiting</p>
          <p className="mt-1 text-xs text-slate-500">New arrivals will appear here.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {queue.map((t, i) => {
            const isBusy = busyId === t._id;
            return (
              <li
                key={t._id}
                className="group flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold ${
                  i === 0 ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30' : 'bg-white/[0.06] text-slate-300'
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{t.customerName}</p>
                    {/^V-/.test(t.ticketNumber) && (
                      <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">VIP</span>
                    )}
                  </div>
                  <p className="truncate font-mono text-[11px] text-slate-400">
                    #{t.ticketNumber} · joined {timeAgo(t.joinedAt)}
                  </p>
                </div>
                <RowButton tone="cyan"    icon={PhoneCall}    disabled={isBusy} onClick={() => onCall(t)}>Call</RowButton>
                <RowButton tone="emerald" icon={CheckCircle2} disabled={isBusy} onClick={() => onServe(t)}>Served</RowButton>
                <RowButton tone="amber"   icon={SkipForward}  disabled={isBusy} onClick={() => onSkip(t)}>Skip</RowButton>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-3 text-xs text-amber-200">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>Customers waiting over 15m show up under Queue Health as delayed.</span>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function timeAgo(iso) {
  if (!iso) return 'just now';
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const TONES = {
  emerald: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30 hover:bg-emerald-500/25',
  cyan:    'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30 hover:bg-cyan-500/25',
  amber:   'bg-amber-500/15 text-amber-200 ring-amber-400/30 hover:bg-amber-500/25',
  violet:  'bg-violet-500/15 text-violet-200 ring-violet-400/30 hover:bg-violet-500/25',
};

function ActionButton({ tone, icon: Icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold ring-1 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 ${TONES[tone]}`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function RowButton({ tone, icon: Icon, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`hidden items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold ring-1 transition-colors disabled:opacity-40 sm:inline-flex ${TONES[tone]}`}
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}
