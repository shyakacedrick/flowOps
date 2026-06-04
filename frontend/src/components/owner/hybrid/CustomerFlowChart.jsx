import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, TrendingUp, TrendingDown, Wifi } from 'lucide-react';
import { useCountUp } from '../../../hooks/useCountUp.js';
import { useLastUpdated } from '../../../hooks/useLastUpdated.js';

/**
 * CustomerFlowChart — premium streaming multi-layer area chart.
 *
 * Behaves like Datadog / Grafana: each engine TICK appends a new data
 * point, the rest shift left, and the chart re-renders smoothly. Hero
 * metrics count up to the latest values; a "Updated Xs ago" tracker
 * resets every time the engine pushes a new event.
 */
export default function CustomerFlowChart({
  totalServed = 242,
  avgWait = 14,
  activeCounters = 4,
  history = [],
}) {
  const points = buildStreamingSeries(history);
  const served = useCountUp(totalServed, { duration: 900 });
  const wait   = useCountUp(avgWait,     { duration: 900 });
  const updated = useLastUpdated();

  return (
    <section className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-2xl backdrop-blur-xl transition-shadow hover:shadow-[0_30px_60px_-20px_rgba(59,130,246,0.35)] sm:p-6">
      <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Customer Flow Intelligence
          </p>
          <h2 className="mt-1 text-base font-semibold text-white sm:text-lg">
            Real-time customer traffic & service performance
          </h2>
          <LiveBadge updated={updated} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <RangePill label="24h" active />
          <RangePill label="7d" />
          <RangePill label="30d" />
          <button className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/[0.04]">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hero metric strip */}
      <div className="relative mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
        <HeroMetric label="Customers served today" value={served.toLocaleString()} delta="+18 vs yesterday" dir="up"   tone="emerald" />
        <HeroMetric label="Average wait time"      value={`${wait}m`}              delta="-2m faster"      dir="down" tone="cyan" />
        <HeroMetric label="Active counters"        value={activeCounters}          delta="of 5 desks"                tone="violet" />
      </div>

      {/* Streaming chart */}
      <div className="relative mt-6 h-56">
        <GradientAreaChart points={points} />
      </div>
    </section>
  );
}

function LiveBadge({ updated }) {
  return (
    <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${updated.fresh ? 'animate-ping' : ''}`} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="font-semibold uppercase tracking-widest text-emerald-300">Live</span>
      <span className="text-slate-500">·</span>
      <Wifi className="h-3 w-3 text-slate-500" />
      <AnimatePresence mode="wait">
        <motion.span
          key={updated.label}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          {updated.label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function RangePill({ label, active = false }) {
  return (
    <button
      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
        active ? 'bg-white/10 text-white ring-1 ring-white/15' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

function HeroMetric({ label, value, delta, dir, tone = 'cyan' }) {
  const tones = {
    emerald: 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/20',
    cyan:    'text-cyan-300 bg-cyan-400/10 ring-cyan-400/20',
    violet:  'text-violet-300 bg-violet-400/10 ring-violet-400/20',
  }[tone];
  const Icon = dir === 'down' ? TrendingDown : TrendingUp;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <motion.p
        key={String(value)}
        initial={{ opacity: 0.6, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-1.5 text-3xl font-bold tracking-tight text-white"
      >
        {value}
      </motion.p>
      {delta && (
        <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tones}`}>
          <Icon className="h-3 w-3" /> {delta}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Streaming chart — every render re-projects the (already-rolling) engine
//  history. The grid + glow stay fixed; only the points move.
// ---------------------------------------------------------------------------

function buildStreamingSeries(history) {
  const len = 36;
  const real = padLeft(history, len);
  return [
    real.map((v, i) => 8 + smooth(real, i, 1) * 6 + v * 2.5),
    real.map((v, i) => 12 + smooth(real, i, 2) * 5 + v * 1.6),
    real.map((v, i) => 18 + smooth(real, i, 3) * 4 + v * 0.9),
  ];
}

function padLeft(arr, n) {
  const src = Array.isArray(arr) ? arr : [];
  if (src.length >= n) return src.slice(-n);
  return new Array(n - src.length).fill(0).concat(src);
}

function smooth(arr, i, span) {
  let sum = 0, count = 0;
  for (let j = Math.max(0, i - span); j <= Math.min(arr.length - 1, i + span); j++) {
    sum += arr[j]; count++;
  }
  return count ? sum / count : 0;
}

function buildPath(series, W, H) {
  if (!series.length) return '';
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = max - min || 1;
  const stepX = W / (series.length - 1);
  return series.map((v, i) => {
    const x = i * stepX;
    const y = H - ((v - min) / range) * (H - 14) - 7;
    if (i === 0) return `M ${x.toFixed(1)},${y.toFixed(1)}`;
    const cx = ((i - 1) * stepX + x) / 2;
    return `Q ${cx.toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function buildArea(series, W, H) {
  const line = buildPath(series, W, H);
  if (!line) return '';
  return `${line} L ${W},${H} L 0,${H} Z`;
}

function GradientAreaChart({ points }) {
  const W = 800;
  const H = 220;
  const layers = [
    { stroke: '#A78BFA', fill: 'url(#cfFillA)', glow: 'rgba(167,139,250,0.55)' },
    { stroke: '#60A5FA', fill: 'url(#cfFillB)', glow: 'rgba(96,165,250,0.45)'  },
    { stroke: '#22D3EE', fill: 'url(#cfFillC)', glow: 'rgba(34,211,238,0.4)'   },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="cfFillA" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cfFillB" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cfFillC" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.2, 0.4, 0.6, 0.8].map((p) => (
        <line key={p} x1="0" x2={W} y1={H * p} y2={H * p}
              stroke="rgba(255,255,255,0.04)" strokeDasharray="3 5" />
      ))}

      {layers.map((layer, idx) => (
        <g key={idx}>
          <motion.path
            d={buildArea(points[idx], W, H)}
            fill={layer.fill}
            animate={{ d: buildArea(points[idx], W, H) }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          <motion.path
            d={buildPath(points[idx], W, H)}
            fill="none"
            stroke={layer.stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
            initial={false}
            animate={{ d: buildPath(points[idx], W, H) }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${layer.glow})` }}
          />
        </g>
      ))}
    </svg>
  );
}
