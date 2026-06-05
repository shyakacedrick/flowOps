import { useEffect, useState } from 'react';
import {
  PhoneCall, CheckCircle2, SkipForward, RotateCcw, ArrowRightLeft,
  Clock, Users, Search, Filter, AlertTriangle,
} from 'lucide-react';
import StaffShell from '@/features/staff/components/StaffShell.jsx';
import PageHeader, { StatCard } from '@/shared/components/PageHeader.jsx';
import { useSimulationSlice, useSimulationDispatch } from '@/engine/SimulationProvider.jsx';
import { EVENT_TYPES, selectAverageWait, selectEstimatedWait } from '@/engine/flowOpsEngine.js';

/**
 * MyQueuePage — the PRIMARY workspace for the operator.
 * Big, fast action surface. Left: current customer + actions.
 * Right: queue list with per-item Call/Skip/Served buttons.
 */
export default function MyQueuePage() {
  const queue       = useSimulationSlice((s) => s.queue);
  const business    = useSimulationSlice((s) => s.business);
  const recent      = useSimulationSlice((s) => s.recent);
  const dispatch    = useSimulationDispatch();
  const avgWait     = Math.round(selectAverageWait(useSimulationSlice((s) => s))) || 8;
  const estWait     = Math.round(selectEstimatedWait(useSimulationSlice((s) => s))) || 6;
  const [filter, setFilter] = useState('all');
  const [query, setQuery]   = useState('');

  const current  = business.currentServing;
  const filtered = queue.filter((c) => {
    if (filter === 'priority' && !/^V-/.test(c.id)) return false;
    if (query && !`${c.id} ${c.name}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <StaffShell>
      <div className="space-y-6 pt-2">
        <PageHeader
          eyebrow="Live workspace"
          title="My Queue"
          subtitle="Call, serve, skip — your live operational console."
          crumbs={[{ label: 'Staff', to: '/staff/dashboard' }, { label: 'My Queue' }]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="In queue"     value={queue.length || 0} delta="Waiting now"   tone="cyan"    icon={Users} />
          <StatCard label="Avg wait"     value={`${avgWait}m`}     delta="Target ≤ 12m"  tone="amber"   icon={Clock} />
          <StatCard label="Est. next"    value={`${estWait}m`}     delta="For next call" tone="violet" />
          <StatCard label="Served today" value={business.totalServed || recent.length || 0} delta="Your shift" tone="emerald" icon={CheckCircle2} />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          <NowServing current={current} dispatch={dispatch} avgService={business.averageServiceTime} />
          <QueueList
            queue={filtered}
            allCount={queue.length}
            dispatch={dispatch}
            filter={filter} setFilter={setFilter}
            query={query} setQuery={setQuery}
          />
        </div>
      </div>
    </StaffShell>
  );
}

// ---------------------------------------------------------------------------

function NowServing({ current, dispatch, avgService }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    if (!current) return undefined;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [current?.id]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.06] via-white/[0.02] to-blue-500/[0.04] p-5 xl:col-span-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-300">Now at Desk 2</p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            {current?.name || 'No customer'}
          </h2>
          <p className="mt-0.5 font-mono text-sm text-slate-400">
            {current?.id || '—'} · {current?.service || 'Idle'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Service time</p>
          <p className="mt-1 font-mono text-3xl font-bold text-white">{mm}:{ss}</p>
          <p className="text-[10px] text-slate-500">avg {Math.round(avgService) || 4}m</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ActionButton
          tone="emerald" icon={CheckCircle2} label="Served"
          disabled={!current}
          onClick={() => dispatch({ type: EVENT_TYPES.SERVE_CUSTOMER })}
        />
        <ActionButton
          tone="cyan" icon={PhoneCall} label="Call next"
          onClick={() => dispatch({ type: EVENT_TYPES.SERVE_CUSTOMER })}
        />
        <ActionButton
          tone="amber" icon={SkipForward} label="Skip"
          disabled={!current}
          onClick={() => dispatch({ type: EVENT_TYPES.SKIP_CUSTOMER })}
        />
        <ActionButton
          tone="violet" icon={ArrowRightLeft} label="Transfer"
          disabled={!current}
          onClick={() => alert('Transfer to: Desk 1 / 3 (demo)')}
        />
      </div>

      <button
        disabled={!current}
        onClick={() => alert('Recall: pinging customer (demo)')}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[0.08] disabled:opacity-40"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Recall customer
      </button>
    </section>
  );
}

function QueueList({ queue, allCount, dispatch, filter, setFilter, query, setQuery }) {
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
          {queue.map((c, i) => (
            <li
              key={c.id}
              className="group flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold ${
                i === 0 ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30' : 'bg-white/[0.06] text-slate-300'
              }`}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{c.name}</p>
                  {/^V-/.test(c.id) && (
                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">VIP</span>
                  )}
                </div>
                <p className="truncate font-mono text-[11px] text-slate-400">
                  {c.id} · {c.service || 'General'}
                </p>
              </div>
              <RowButton tone="cyan"    icon={PhoneCall}     onClick={() => dispatch({ type: EVENT_TYPES.SERVE_CUSTOMER })}>Call</RowButton>
              <RowButton tone="emerald" icon={CheckCircle2}  onClick={() => dispatch({ type: EVENT_TYPES.SERVE_CUSTOMER })}>Served</RowButton>
              <RowButton tone="amber"   icon={SkipForward}   onClick={() => dispatch({ type: EVENT_TYPES.SKIP_CUSTOMER })}>Skip</RowButton>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-3 text-xs text-amber-200">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>Customers waiting over 15m will trigger a priority alert.</span>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

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

function RowButton({ tone, icon: Icon, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`hidden items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold ring-1 transition-colors sm:inline-flex ${TONES[tone]}`}
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}
