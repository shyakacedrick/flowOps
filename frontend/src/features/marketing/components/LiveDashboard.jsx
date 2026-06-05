import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  UserPlus,
  SkipForward,
  Pause,
  RefreshCw,
} from 'lucide-react';
import { useFlowOps, useFlowOpsDispatch } from '@/engine/FlowOpsProvider.jsx';
import {
  EVENT_TYPES,
  selectAverageWait,
  selectEfficiency,
  selectEstimatedWait,
  selectQueueLength,
  selectStatus,
} from '@/engine/flowOpsEngine.js';
import { useCountUp } from '@/shared/hooks/useCountUp.js';
import {
  cardHover,
  ease,
  kpiValue,
  pulseDot,
  queueItem,
  viewport,
} from '@/animations/motion';

// ---------- atoms ----------

function StatusPill({ status }) {
  const tone = {
    idle:   'bg-slate-500/15 text-slate-300 border-slate-400/20',
    steady: 'bg-secondary/15 text-secondary border-secondary/30',
    active: 'bg-primary/15 text-primary border-primary/30',
    busy:   'bg-amber-400/15 text-amber-300 border-amber-400/30',
  }[status.tone];
  return (
    <motion.span
      layout
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${tone}`}
    >
      <span className="relative flex h-2 w-2">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-current"
          variants={pulseDot}
          animate="animate"
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status.label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: ease.out }}
        >
          {status.label}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

function KPI({ icon: Icon, label, value, suffix = '', decimals = 0, tint = 'primary' }) {
  const shown = useCountUp(value, { duration: 700, decimals });
  const tintMap = {
    primary:   'from-primary/20 to-primary/0 text-primary',
    secondary: 'from-secondary/20 to-secondary/0 text-secondary',
    emerald:   'from-emerald-400/20 to-emerald-400/0 text-emerald-400',
    amber:     'from-amber-400/20 to-amber-400/0 text-amber-300',
  }[tint];
  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      animate="rest"
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl"
    >
      <div className={`pointer-events-none absolute -top-12 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${tintMap} blur-2xl opacity-40`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-white tabular-nums">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={shown}
                variants={kpiValue}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
                className="inline-block"
              >
                {shown}
              </motion.span>
            </AnimatePresence>
            {suffix && (
              <span className="ml-0.5 text-base font-medium text-slate-400">
                {suffix}
              </span>
            )}
          </p>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-gradient-to-br ${tintMap}`}>
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </div>
      </div>
    </motion.div>
  );
}

function Sparkline({ points }) {
  const w = 220;
  const h = 56;
  if (!points?.length) {
    return <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" aria-hidden />;
  }
  const max = Math.max(1, ...points);
  const step = points.length > 1 ? w / (points.length - 1) : 0;
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = h - (p / max) * (h - 6) - 3;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${d} L ${w} ${h} L 0 ${h} Z`}
        fill="url(#spark-fill)"
        initial={false}
        animate={{ d: `${d} L ${w} ${h} L 0 ${h} Z` }}
        transition={{ duration: 0.7, ease: ease.out }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#06B6D4"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ d }}
        transition={{ duration: 0.7, ease: ease.out }}
      />
    </svg>
  );
}

function EventIcon({ type }) {
  const map = {
    NEW_CUSTOMER:   { Icon: UserPlus,     cls: 'text-secondary bg-secondary/10 border-secondary/30' },
    SERVE_CUSTOMER: { Icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
    SKIP_CUSTOMER:  { Icon: SkipForward,  cls: 'text-amber-300 bg-amber-400/10 border-amber-400/30' },
    IDLE_PERIOD:    { Icon: Pause,        cls: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
    BOOT:           { Icon: Activity,     cls: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  }[type] || { Icon: Activity, cls: 'text-slate-400 bg-slate-500/10 border-slate-500/30' };
  const { Icon, cls } = map;
  return (
    <span className={`grid h-7 w-7 place-items-center rounded-md border ${cls}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
    </span>
  );
}

// ---------- main ----------

export default function LiveDashboard() {
  const state    = useFlowOps();
  const dispatch = useFlowOpsDispatch();

  const queueLen   = selectQueueLength(state);
  const avgWait    = selectAverageWait(state);
  const estWait    = selectEstimatedWait(state);
  const efficiency = selectEfficiency(state);
  const status     = selectStatus(state);

  const feed = useMemo(() => {
    const items = [];
    if (state.business.currentServing) {
      items.push({
        key: `serve-${state.business.currentServing.id}`,
        type: 'SERVE_CUSTOMER',
        label: `Served ${state.business.currentServing.id} • ${state.business.currentServing.name}`,
        sub: `${state.business.currentServing.service} · waited ${state.business.currentServing.waitedFor}m`,
      });
    }
    state.recent.slice(1, 4).forEach((c) => {
      items.push({
        key: `recent-${c.id}`,
        type: 'SERVE_CUSTOMER',
        label: `${c.id} completed`,
        sub: `${c.service} · waited ${c.waitedFor}m`,
      });
    });
    if (state.lastEvent.type === 'NEW_CUSTOMER') {
      items.unshift({
        key: `new-${state.lastEvent.ref}-${state.lastEvent.at}`,
        type: 'NEW_CUSTOMER',
        label: `${state.lastEvent.ref} joined queue`,
        sub: 'Status: waiting',
      });
    }
    if (state.lastEvent.type === 'SKIP_CUSTOMER') {
      items.unshift({
        key: `skip-${state.lastEvent.ref}-${state.lastEvent.at}`,
        type: 'SKIP_CUSTOMER',
        label: `${state.lastEvent.ref} re-queued`,
        sub: 'Customer skipped, moved to end',
      });
    }
    return items.slice(0, 5);
  }, [state.business.currentServing, state.recent, state.lastEvent]);

  const simClock = useMemo(() => {
    const hh = String(Math.floor(state.simTime / 60) % 24).padStart(2, '0');
    const mm = String(state.simTime % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }, [state.simTime]);

  const visibleQueue = state.queue.slice(0, 7);
  const overflow = Math.max(0, state.queue.length - 7);

  return (
    <section id="demo" className="section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport.once}
        transition={{ duration: 0.6, ease: ease.out }}
        className="mx-auto max-w-3xl text-center"
      >
        <span className="eyebrow">Live Simulation</span>
        <h2 className="h-section mt-5">
          The dashboard your team would see, right now.
        </h2>
        <p className="mt-5 text-lg text-muted">
          A real-time simulation of FlowOps in production. Customers join,
          get served, and analytics update — driven by a live event engine.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport.once}
        transition={{ duration: 0.7, ease: ease.out, delay: 0.1 }}
        className="mt-14 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 shadow-glow-lg backdrop-blur-2xl md:p-8"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-primary/30 to-secondary/20 text-white">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Operations Console</p>
              <p className="text-xs text-slate-500">
                Sim clock <span className="font-mono text-slate-300">{simClock}</span>
                <span className="mx-2 text-slate-700">·</span>
                1 second = 1 minute
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={status} />
            <motion.button
              type="button"
              onClick={() => dispatch({ type: EVENT_TYPES.RESET })}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15, ease: ease.out }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300 hover:border-white/20 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </motion.button>
          </div>
        </div>

        {/* KPI grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPI icon={Users}        label="In queue"       value={queueLen}                    tint="primary" />
          <KPI icon={Clock}        label="Avg wait"       value={avgWait} suffix="m" decimals={1} tint="secondary" />
          <KPI icon={CheckCircle2} label="Served today"   value={state.analytics.totalServed} tint="emerald" />
          <KPI icon={TrendingUp}   label="Efficiency"     value={efficiency} suffix="%"        tint="amber" />
        </div>

        {/* Main row */}
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          {/* Queue */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Live Queue</h3>
              <span className="text-xs text-slate-500">
                est. wait <span className="font-mono text-slate-300">{estWait}m</span>
              </span>
            </div>
            <div className="mt-3 rounded-2xl border border-white/[0.06] bg-slate-950/40 p-3">
              {state.queue.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 py-8 text-center text-sm text-slate-500"
                >
                  No one waiting. Idle period.
                </motion.p>
              ) : (
                <motion.ul layout className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {visibleQueue.map((c, i) => (
                      <motion.li
                        key={c.id}
                        layout
                        variants={queueItem}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-md font-mono text-[10px] font-bold ${
                              i === 0
                                ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                                : 'border border-white/10 bg-white/[0.03] text-slate-400'
                            }`}
                          >
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white">
                              <span className="font-mono text-xs text-slate-500">{c.id}</span>
                              <span className="mx-1.5 text-slate-700">·</span>
                              {c.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">{c.service}</p>
                          </div>
                        </div>
                        <span className="ml-3 shrink-0 font-mono text-xs text-slate-400 tabular-nums">
                          {Math.max(0, state.simTime - c.joinedAt)}m
                        </span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  {overflow > 0 && (
                    <motion.li
                      layout
                      className="px-3 pt-1 text-center text-[11px] text-slate-500"
                    >
                      +{overflow} more in queue
                    </motion.li>
                  )}
                </motion.ul>
              )}
            </div>
          </div>

          {/* Center */}
          <div className="lg:col-span-4">
            <h3 className="text-sm font-semibold text-white">Queue length · last 12 min</h3>
            <div className="mt-3 rounded-2xl border border-white/[0.06] bg-slate-950/40 p-4">
              <Sparkline points={state.history} />
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.05] pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Avg service</p>
                  <p className="mt-1 text-lg font-semibold text-white tabular-nums">
                    {state.business.averageServiceTime.toFixed(1)}<span className="ml-0.5 text-xs text-slate-500">m</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Arrivals</p>
                  <p className="mt-1 text-lg font-semibold text-white tabular-nums">
                    {state.analytics.totalArrivals}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Peak hour</p>
                  <p className="mt-1 text-lg font-semibold text-white tabular-nums">
                    {state.analytics.peakHour}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Now serving</p>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={state.business.currentServing?.id ?? 'none'}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: ease.out }}
                      className="mt-1 truncate text-lg font-semibold text-white"
                    >
                      {state.business.currentServing ? state.business.currentServing.id : '—'}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Event feed */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-white">Event feed</h3>
            <div className="mt-3 rounded-2xl border border-white/[0.06] bg-slate-950/40 p-3">
              {feed.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-500">Waiting for activity…</p>
              ) : (
                <motion.ul layout className="space-y-2">
                  <AnimatePresence initial={false}>
                    {feed.map((e) => (
                      <motion.li
                        key={e.key}
                        layout
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.28, ease: ease.out }}
                        className="flex items-start gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5"
                      >
                        <EventIcon type={e.type} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-white">{e.label}</p>
                          <p className="truncate text-[11px] text-slate-500">{e.sub}</p>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
