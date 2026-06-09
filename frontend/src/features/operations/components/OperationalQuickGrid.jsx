import { motion } from 'framer-motion';
import {
  Users,
  PlayCircle,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useCountUp } from '@/shared/hooks/useCountUp.js';

/**
 * OperationalQuickGrid — four honest at-a-glance KPIs that complement
 * (rather than duplicate) the CustomerFlowChart above.
 *
 * Every value is real data passed by the dashboard. No floating "+"
 * actions, no fake CTAs. If a number is interactive, it lives elsewhere
 * (LiveTicketsCard / staff dashboard).
 *
 * Tiles:
 *   1. Waiting now       — live queue depth
 *   2. Serving now       — desks currently engaged
 *   3. Abandon rate      — % skipped + cancelled over window (lower = better)
 *   4. Peak hour         — when demand crested during the window
 */
export default function OperationalQuickGrid({
  waiting = 0,
  serving = 0,
  abandonRate = 0,          // 0–100 (% over the analytics window)
  prevAbandonRate = null,   // for delta arrow
  peakHour = null,          // 0–23 or null
  totalCounters = 0,
  avgWaitMins = null,
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatTile
        icon={Users}
        label="Waiting"
        value={waiting}
        sub={avgWaitMins != null && avgWaitMins > 0
          ? `${formatNum(avgWaitMins)}m avg wait`
          : 'live queue depth'}
        accent="violet"
      />
      <StatTile
        icon={PlayCircle}
        label="Serving"
        value={serving}
        sub={totalCounters
          ? `of ${totalCounters} desk${totalCounters === 1 ? '' : 's'}`
          : 'in progress'}
        accent="emerald"
      />
      <AbandonTile
        value={abandonRate}
        prev={prevAbandonRate}
      />
      <PeakHourTile peakHour={peakHour} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Tiles
// ──────────────────────────────────────────────────────────────────────

const ACCENTS = {
  violet:  'text-violet-300  bg-violet-400/10',
  emerald: 'text-emerald-300 bg-emerald-400/10',
  amber:   'text-amber-300   bg-amber-400/10',
  rose:    'text-rose-300    bg-rose-400/10',
  slate:   'text-slate-300   bg-slate-400/10',
};

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'slate',
  children,
}) {
  const isNumeric = typeof value === 'number';
  const animated = useCountUp(isNumeric ? value : 0, {
    duration: 800,
    active: isNumeric,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-white/[0.06] bg-slate-950/40 p-4 transition-colors hover:border-white/[0.12]"
    >
      <div className="flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${ACCENTS[accent]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <motion.span
          key={String(value)}
          initial={{ opacity: 0.6, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          {isNumeric ? animated : value}
        </motion.span>
        {children}
      </div>

      {sub && (
        <p className="mt-1 truncate text-[11px] text-slate-500">{sub}</p>
      )}
    </motion.div>
  );
}

function AbandonTile({ value, prev }) {
  // Abandon rate: lower is better. So "down" trend = green.
  const delta = prev == null ? null : value - prev;
  // Graded severity — matches the global semantics:
  //   emerald = healthy, amber = watching, rose = critical.
  const tone =
    value == null      ? 'slate'
    : value >= 20      ? 'rose'
    : value >= 10      ? 'amber'
    :                    'emerald';
  return (
    <StatTile
      icon={AlertTriangle}
      label="Abandon rate"
      value={`${formatNum(value ?? 0)}%`}
      sub={describeAbandon(value)}
      accent={tone}
    >
      {delta != null && Math.abs(delta) >= 0.5 && (
        <DeltaPill diff={delta} invert />
      )}
    </StatTile>
  );
}

function PeakHourTile({ peakHour }) {
  const label = peakHour == null ? '—' : formatHour(peakHour);
  return (
    <StatTile
      icon={Sparkles}
      label="Peak hour"
      value={label}
      sub={peakHour == null ? 'not enough data yet' : 'busiest in window'}
      accent="slate"
    />
  );
}

function DeltaPill({ diff, invert = false }) {
  // For "lower is better" metrics, pass invert=true to flip the colors.
  const isUp = diff > 0;
  const good = invert ? !isUp : isUp;
  const tone = good ? 'text-emerald-400' : 'text-rose-400';
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${tone}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(diff).toFixed(1)}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────────────

function formatNum(n) {
  if (n == null || Number.isNaN(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatHour(h) {
  const hh = String(h).padStart(2, '0');
  return `${hh}:00`;
}

function describeAbandon(rate) {
  if (rate == null) return 'no data';
  if (rate === 0)  return 'no drop-offs';
  if (rate < 5)    return 'within target';
  if (rate < 15)   return 'worth watching';
  return 'high — investigate';
}
