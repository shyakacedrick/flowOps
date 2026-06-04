import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  PhoneCall,
  SkipForward,
  CheckCircle2,
  Pause,
  Play,
  Clock,
  Users,
  Gauge,
  Sparkles,
  TrendingUp,
  Bell,
  Coffee,
  UserPlus,
  Inbox,
  History,
} from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SystemPhaseBanner from '../components/SystemPhaseBanner.jsx';
import StatusIndicator from '../components/shared/StatusIndicator.jsx';
import {
  useSimulationSlice,
  useSimulationControls,
  useSimulationDispatch,
} from '../engine/SimulationProvider.jsx';
import { useCountUp } from '../hooks/useCountUp.js';
import {
  EVENT_TYPES,
  selectEstimatedWait,
  selectAverageWait,
  selectEfficiency,
  selectStatus,
} from '../engine/flowOpsEngine.js';
import { ease, queueItem, fadeUpItem } from '../animations/motion.js';

const NAV = [
  { key: 'live',    label: 'Live queue', icon: Activity },
  { key: 'served',  label: 'Served',     icon: CheckCircle2 },
  { key: 'breaks',  label: 'Breaks',     icon: Coffee },
  { key: 'alerts',  label: 'Alerts',     icon: Bell },
];

// ---------- shared atoms ----------

function LivePulse({ paused }) {
  return <StatusIndicator status={paused ? 'paused' : 'live'} />;
}

function StatusPill({ status }) {
  const styles = {
    next:    'border-primary/40 bg-primary/15 text-primary',
    waiting: 'border-white/10 bg-white/[0.04] text-slate-300',
    skipped: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  }[status] || 'border-white/10 bg-white/[0.04] text-slate-300';
  const label = { next: 'Next', waiting: 'Waiting', skipped: 'Skipped' }[status] || 'Waiting';
  return (
    <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles}`}>
      {label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, suffix = '', decimals = 0, tone = 'primary', hint }) {
  const shown = useCountUp(value, { duration: 700, decimals });
  const toneMap = {
    primary:  'from-primary/20 to-primary/0   text-primary',
    cyan:     'from-secondary/20 to-secondary/0 text-secondary',
    emerald:  'from-emerald-500/20 to-emerald-500/0 text-emerald-300',
    amber:    'from-amber-500/20 to-amber-500/0 text-amber-300',
  }[tone];
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: ease.out }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl"
    >
      <div className={`pointer-events-none absolute -top-12 -right-10 h-28 w-28 rounded-full bg-gradient-to-br ${toneMap.split(' text-')[0]} blur-2xl opacity-60`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-white tabular-nums">
            {shown}{suffix && <span className="ml-0.5 text-sm font-medium text-slate-400">{suffix}</span>}
          </p>
          {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
        </div>
        <div className={`grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-${tone}`}>
          <Icon className={`h-3.5 w-3.5 ${toneMap.split(' text-')[1] ? 'text-' + toneMap.split(' text-')[1] : ''}`} strokeWidth={2.2} />
        </div>
      </div>
    </motion.div>
  );
}

// ---------- panels ----------

function QueueListPanel({ queue, simTime, onCall, onSkip, onServe, onAddDemo, canAct }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Live queue</h2>
          <p className="text-xs text-slate-500">{queue.length} customers waiting</p>
        </div>
        <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-slate-400">
          QUEUE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {queue.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No customers in queue"
            message="The queue is currently empty. New customers will appear here in real time as they arrive."
            cta={{ label: 'Add demo customer', onClick: onAddDemo, icon: UserPlus }}
            hint="Live · listening for arrivals"
            size="md"
          />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {queue.slice(0, 12).map((c, i) => {
                const status = i === 0 ? 'next' : c.skipped ? 'skipped' : 'waiting';
                const wait = Math.max(0, simTime - c.joinedAt);
                const isNext = i === 0;
                return (
                  <motion.li
                    key={c.id}
                    layout
                    variants={queueItem}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className={`group rounded-xl border px-3 py-2.5 transition-colors ${
                      isNext
                        ? 'border-primary/40 bg-primary/[0.08] shadow-glow'
                        : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-mono text-[10px] font-bold ${
                          isNext
                            ? 'bg-primary text-white shadow-glow'
                            : 'border border-white/10 bg-white/[0.03] text-slate-400'
                        }`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-white">{c.name}</p>
                            <StatusPill status={status} />
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            <span className="font-mono">{c.id}</span> · {c.service} · waiting {wait}m
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
                      {isNext && (
                        <button
                          type="button"
                          disabled={!canAct}
                          onClick={onCall}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
                        >
                          <PhoneCall className="h-3 w-3" /> Call
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!canAct || queue.length < 2}
                        onClick={onSkip}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-white/20 hover:text-white disabled:opacity-40"
                      >
                        <SkipForward className="h-3 w-3" /> Skip
                      </button>
                      {isNext && (
                        <button
                          type="button"
                          disabled={!canAct}
                          onClick={onServe}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] font-medium text-emerald-300 hover:border-emerald-400/50 disabled:opacity-40"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Served
                        </button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

function ControlPanel({ head, simTime, paused, onCall, onSkip, onServe, onPause }) {
  // Real-time service timer in seconds since head took the front position.
  const [serviceSeconds, setServiceSeconds] = useState(0);
  const headId = head?.id ?? null;

  useEffect(() => {
    setServiceSeconds(0);
    if (!headId || paused) return undefined;
    const id = setInterval(() => setServiceSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [headId, paused]);

  const mm = String(Math.floor(serviceSeconds / 60)).padStart(2, '0');
  const ss = String(serviceSeconds % 60).padStart(2, '0');

  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Control station</p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {head ? 'Now at counter' : 'Counter idle'}
            </h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
            head
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
              : 'border-white/10 bg-white/[0.04] text-slate-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${head ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {head ? 'Serving' : 'Idle'}
          </span>
        </div>

        <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {head ? (
              <motion.div
                key={head.id}
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.35, ease: ease.out }}
                className="w-full"
              >
                <p className="font-mono text-7xl font-bold text-white tracking-tight">{head.id}</p>
                <p className="mt-3 text-xl text-slate-200">{head.name}</p>
                <p className="mt-1 text-sm text-slate-500">{head.service}</p>

                <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-7 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Service timer
                  </p>
                  <p className="mt-1 font-mono text-3xl font-bold text-white tabular-nums">
                    {mm}:{ss}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <EmptyState
                  icon={Coffee}
                  title="No active service"
                  message="Counter is idle. The next customer in line will appear here automatically."
                  hint="Awaiting first arrival"
                  size="md"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 space-y-2">
          <motion.button
            type="button"
            disabled={!head || paused}
            onClick={onCall}
            whileHover={head && !paused ? { scale: 1.01, y: -1 } : {}}
            whileTap={head && !paused ? { scale: 0.99 } : {}}
            transition={{ duration: 0.15, ease: ease.out }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-colors ${
              head && !paused
                ? 'bg-primary text-white shadow-glow hover:bg-blue-500 hover:shadow-glow-lg'
                : 'cursor-not-allowed border border-white/[0.06] bg-white/[0.02] text-slate-600'
            }`}
          >
            <PhoneCall className="h-4 w-4" />
            Call next customer
          </motion.button>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={!head || paused}
              onClick={onServe}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2.5 text-xs font-semibold text-emerald-300 hover:border-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Served
            </button>
            <button
              type="button"
              disabled={!head || paused}
              onClick={onSkip}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </button>
            <button
              type="button"
              onClick={onPause}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                paused
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:border-amber-400/60'
                  : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsPanel({ paused }) {
  // Subscribe to only the fields needed here — avoids prop drilling full state.
  const queue      = useSimulationSlice((s) => s.queue);
  const analytics  = useSimulationSlice((s) => s.analytics);
  const recent     = useSimulationSlice((s) => s.recent);
  const stateSlice = useSimulationSlice((s) => ({
    queue: s.queue, analytics: s.analytics, business: s.business,
    history: s.history, recent: s.recent, lastEvent: s.lastEvent, systemStatus: s.systemStatus,
  }));

  const efficiency = selectEfficiency(stateSlice);
  const avgWait    = selectAverageWait(stateSlice);
  const estWait    = selectEstimatedWait(stateSlice);
  const status     = selectStatus(stateSlice);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={Users}        label="Queue length" value={queue.length} tone="primary" />
        <KpiCard icon={Clock}        label="Est. wait"    value={estWait} suffix="m" tone="cyan" />
        <KpiCard icon={Clock}        label="Avg wait"     value={avgWait} suffix="m" decimals={1} tone="amber" />
        <KpiCard icon={CheckCircle2} label="Served today" value={analytics.totalServed} tone="emerald" />
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Efficiency score
          </p>
          <span className={`text-[11px] font-semibold ${
            efficiency >= 80 ? 'text-emerald-400' : efficiency >= 60 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {efficiency}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.05]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${efficiency}%` }}
            transition={{ duration: 0.6, ease: ease.out }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Ratio of customers served vs. arrived
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Peak hour
        </p>
        <p className="mt-1 font-mono text-2xl font-bold text-white">{analytics.peakHour}</p>
        <p className="text-[11px] text-slate-500">Busiest window today</p>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            System status
          </p>
          <LivePulse paused={paused} />
        </div>
        <p className="mt-2 text-sm text-slate-200">
          Counter is <span className="font-semibold text-white">{status.label.toLowerCase()}</span>.
          {paused
            ? ' Auto-arrivals are paused; manual control only.'
            : ' Customers are flowing in real time.'}
        </p>
      </div>

      <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Recently served
        </p>
        <div className="mt-2 space-y-1.5">
          {recent.length === 0 ? (
            <EmptyState
              icon={History}
              title="Nothing served yet"
              message="Completed customers will be listed here as transactions close."
              size="sm"
              tone="success"
            />
          ) : (
            recent.slice(0, 4).map((c) => (
              <motion.div
                key={`recent-${c.id}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: ease.out }}
                className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 text-xs"
              >
                <span className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="font-mono text-slate-500">{c.id}</span>
                  <span>{c.name}</span>
                </span>
                <span className="font-mono text-slate-500">{c.waitedFor}m wait</span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- main ----------

export default function StaffDashboard() {
  const [tab, setTab] = useState('live');

  // Subscribe to targeted slices only — no full re-render on every tick.
  const queue   = useSimulationSlice((s) => s.queue);
  const simTime = useSimulationSlice((s) => s.simTime);
  const dispatch = useSimulationDispatch();
  const { running, toggle } = useSimulationControls();
  const paused = !running;

  const head = queue[0] ?? null;

  // Stable handler references prevent unnecessary child re-renders.
  const handleServe   = useCallback(() => dispatch({ type: EVENT_TYPES.SERVE_CUSTOMER }), [dispatch]);
  const handleSkip    = useCallback(() => dispatch({ type: EVENT_TYPES.SKIP_CUSTOMER }), [dispatch]);
  const handleAddDemo = useCallback(() => dispatch({ type: EVENT_TYPES.NEW_CUSTOMER }), [dispatch]);

  return (
    <DashboardShell navItems={NAV} activeKey={tab} onNav={setTab}>
      <motion.div
        variants={fadeUpItem(0)}
        initial="hidden"
        animate="show"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Live Queue Control Center</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time customer flow · operational console
          </p>
        </div>
        <LivePulse paused={paused} />
      </motion.div>

      {/* Product-story phase banner — evolves as the system comes alive */}
      <motion.div
        variants={fadeUpItem(0.05)}
        initial="hidden"
        animate="show"
        className="mt-4"
      >
        <SystemPhaseBanner />
      </motion.div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12 lg:[grid-auto-rows:minmax(0,1fr)]">
        <motion.div
          variants={fadeUpItem(0.08)}
          initial="hidden"
          animate="show"
          className="lg:col-span-4 min-h-[640px]"
        >
          <QueueListPanel
            queue={queue}
            simTime={simTime}
            canAct={!paused}
            onCall={handleServe}
            onSkip={handleSkip}
            onServe={handleServe}
            onAddDemo={handleAddDemo}
          />
        </motion.div>
        <motion.div
          variants={fadeUpItem(0.18)}
          initial="hidden"
          animate="show"
          className="lg:col-span-4 min-h-[640px]"
        >
          <ControlPanel
            head={head}
            simTime={simTime}
            paused={paused}
            onCall={handleServe}
            onSkip={handleSkip}
            onServe={handleServe}
            onPause={toggle}
          />
        </motion.div>
        <motion.div
          variants={fadeUpItem(0.28)}
          initial="hidden"
          animate="show"
          className="lg:col-span-4 min-h-[640px]"
        >
          <InsightsPanel paused={paused} />
        </motion.div>
      </div>
    </DashboardShell>
  );
}
