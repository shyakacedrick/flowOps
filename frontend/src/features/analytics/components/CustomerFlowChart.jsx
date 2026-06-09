import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCountUp } from '@/shared/hooks/useCountUp.js';
import { useLastUpdated } from '@/shared/hooks/useLastUpdated.js';

/**
 * CustomerFlowChart — clean multi-series line chart for customer flow.
 *
 * Three real signals, plotted on ONE shared Y-axis so they're actually
 * visually comparable:
 *   • joined    (violet)   — demand        (new tickets per bucket)
 *   • served    (emerald)  — throughput    (tickets resolved per bucket)
 *   • abandoned (rose)     — leakage       (skipped + cancelled)
 *
 * The chart includes a real X-axis (time labels from the buckets), a
 * real Y-axis (0 → max), a soft grid, a legend, and a hover crosshair
 * with per-series readout.
 */
export default function CustomerFlowChart({
  totalServed = 0,
  avgWait = 0,
  activeCounters = 0,
  totalCounters = null,
  joinedSeries = [],
  servedSeries = [],
  abandonedSeries = [],
  bucketLabels = [],            // string[] same length as series, e.g. ['14:00', ...]
  previous = null,              // { served, avgWaitMins, abandonRate }
  range = '24h',
  onRangeChange = null,
}) {
  const served = useCountUp(totalServed, { duration: 900 });
  const wait   = useCountUp(avgWait,     { duration: 900 });
  const updated = useLastUpdated();

  const servedDelta = formatCountDelta(totalServed, previous?.served);
  const waitDelta   = formatMinutesDelta(avgWait, previous?.avgWaitMins);
  const countersHint = totalCounters != null
    ? `of ${totalCounters} desk${totalCounters === 1 ? '' : 's'}`
    : 'live';

  const isEmpty = !joinedSeries.length && !servedSeries.length && !abandonedSeries.length;

  return (
    <section className="rounded-3xl border border-white/[0.06] bg-slate-950/40 p-5 sm:p-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Customer flow
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Demand, throughput, and leakage over the selected window.
          </p>
          <LiveBadge updated={updated} />
        </div>
        <RangeSwitcher value={range} onChange={onRangeChange} />
      </header>

      {/* ── Hero metric strip ───────────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-4 border-y border-white/[0.05] py-4 sm:grid-cols-3">
        <HeroMetric
          label="Served"
          value={served.toLocaleString()}
          delta={servedDelta.label}
          dir={servedDelta.dir}
        />
        <HeroMetric
          label="Avg wait"
          value={`${wait}m`}
          delta={waitDelta.label}
          dir={waitDelta.dir}
          invert
        />
        <HeroMetric
          label="Active counters"
          value={activeCounters}
          delta={countersHint}
          neutral
        />
      </div>

      {/* ── Chart ───────────────────────────────────────────────────── */}
      <div className="mt-5">
        {isEmpty ? (
          <EmptyChart />
        ) : (
          <CleanLineChart
            joined={joinedSeries}
            served={servedSeries}
            abandoned={abandonedSeries}
            labels={bucketLabels}
          />
        )}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <Legend />
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Header bits
// ──────────────────────────────────────────────────────────────────────

function LiveBadge({ updated }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${updated.fresh ? 'animate-ping' : ''}`} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="font-medium text-emerald-300">Live</span>
      <span className="text-slate-600">·</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={updated.label}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.2 }}
          className="text-slate-500"
        >
          updated {updated.label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

const RANGES = [
  { value: '24h', label: '24h' },
  { value: '7d',  label: '7d' },
  { value: '30d', label: '30d' },
];

function RangeSwitcher({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.02] p-0.5 text-[11px] font-medium">
      {RANGES.map((r) => {
        const active = r.value === value;
        return (
          <button
            key={r.value}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(r.value)}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              active
                ? 'bg-white/[0.08] text-white'
                : 'text-slate-400 hover:text-slate-200'
            } ${!onChange ? 'cursor-default' : ''}`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

function HeroMetric({ label, value, delta, dir = 'up', neutral = false, invert = false }) {
  // For wait-time, lower is better → invert the tone mapping.
  const effectiveDir = invert
    ? (dir === 'down' ? 'up' : dir === 'up' ? 'down' : dir)
    : dir;
  const tone = neutral
    ? 'text-slate-400'
    : effectiveDir === 'up'
      ? 'text-emerald-400'
      : effectiveDir === 'down'
        ? 'text-rose-400'
        : 'text-slate-400';
  const Icon = neutral
    ? Minus
    : dir === 'down'
      ? TrendingDown
      : dir === 'up'
        ? TrendingUp
        : Minus;

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <motion.p
        key={String(value)}
        initial={{ opacity: 0.6, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
      >
        {value}
      </motion.p>
      {delta && (
        <span className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium ${tone}`}>
          <Icon className="h-3 w-3" /> {delta}
        </span>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
      <LegendItem color="#A78BFA" label="Joined" />
      <LegendItem color="#34D399" label="Served" />
      <LegendItem color="#FB7185" label="Abandoned" />
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Chart
// ──────────────────────────────────────────────────────────────────────

const SERIES_META = [
  { key: 'joined',    color: '#A78BFA', label: 'Joined' },
  { key: 'served',    color: '#34D399', label: 'Served' },
  { key: 'abandoned', color: '#FB7185', label: 'Abandoned' },
];

function CleanLineChart({ joined, served, abandoned, labels }) {
  // Pad all three series to the same length so they share an X-axis.
  const len = Math.max(joined.length, served.length, abandoned.length, 12);
  const j = padLeft(joined,    len);
  const s = padLeft(served,    len);
  const a = padLeft(abandoned, len);
  const lab = padLeft(labels,  len, '');

  // Shared Y-scale: max of all three series (so the lines are honestly
  // comparable). +1 ceiling so a flat-zero stretch still has headroom.
  const yMax = Math.max(1, ...j, ...s, ...a);
  const niceMax = niceCeil(yMax);
  const yTicks = buildYTicks(niceMax);

  // SVG geometry.
  const PAD_L = 32;
  const PAD_R = 12;
  const PAD_T = 8;
  const PAD_B = 22;
  const W = 800;
  const H = 220;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const xAt = (i) => PAD_L + (len === 1 ? innerW / 2 : (i * innerW) / (len - 1));
  const yAt = (v) => PAD_T + innerH - (v / niceMax) * innerH;

  const linePath = (series) =>
    series
      .map((v, i) => {
        const x = xAt(i);
        const y = yAt(v);
        if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        const prevX = xAt(i - 1);
        const cx = (prevX + x) / 2;
        return `Q ${cx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  const areaPath = (series) => {
    const top = linePath(series);
    if (!top) return '';
    const lastX = xAt(series.length - 1).toFixed(1);
    const firstX = xAt(0).toFixed(1);
    const baseY = (PAD_T + innerH).toFixed(1);
    return `${top} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  // X-axis label cadence — pick ~6 evenly-spaced ticks.
  const xLabelIndices = useMemo(() => pickIndices(len, 6), [len]);

  // ── Hover crosshair ──────────────────────────────────────────────
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const handleMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const xPx = ratio * W;
    if (xPx < PAD_L || xPx > W - PAD_R) {
      setHoverIdx(null);
      return;
    }
    const t = (xPx - PAD_L) / innerW;
    const i = Math.round(t * (len - 1));
    setHoverIdx(Math.max(0, Math.min(len - 1, i)));
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-56 w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          {SERIES_META.map((m) => (
            <linearGradient key={m.key} id={`cf-${m.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"   stopColor={m.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={m.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Y-axis grid + labels */}
        {yTicks.map((t) => {
          const y = yAt(t);
          return (
            <g key={t}>
              <line
                x1={PAD_L} x2={W - PAD_R}
                y1={y} y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="2 4"
              />
              <text
                x={PAD_L - 6} y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="rgba(148,163,184,0.7)"
                fontFamily="ui-sans-serif, system-ui"
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={PAD_L} x2={W - PAD_R}
          y1={PAD_T + innerH} y2={PAD_T + innerH}
          stroke="rgba(255,255,255,0.08)"
        />

        {/* X-axis labels */}
        {xLabelIndices.map((i) => (
          <text
            key={i}
            x={xAt(i)} y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(148,163,184,0.7)"
            fontFamily="ui-sans-serif, system-ui"
          >
            {lab[i] || ''}
          </text>
        ))}

        {/* Series — areas first, then lines, so lines stay crisp on top */}
        {SERIES_META.map((m, idx) => {
          const data = [j, s, a][idx];
          return (
            <motion.path
              key={`area-${m.key}`}
              d={areaPath(data)}
              fill={`url(#cf-${m.key})`}
              initial={false}
              animate={{ d: areaPath(data) }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          );
        })}
        {SERIES_META.map((m, idx) => {
          const data = [j, s, a][idx];
          return (
            <motion.path
              key={`line-${m.key}`}
              d={linePath(data)}
              fill="none"
              stroke={m.color}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ d: linePath(data) }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          );
        })}

        {/* Hover crosshair + per-series dots */}
        {hoverIdx != null && (
          <g pointerEvents="none">
            <line
              x1={xAt(hoverIdx)} x2={xAt(hoverIdx)}
              y1={PAD_T} y2={PAD_T + innerH}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="3 3"
            />
            {SERIES_META.map((m, idx) => {
              const v = [j, s, a][idx][hoverIdx];
              return (
                <circle
                  key={`dot-${m.key}`}
                  cx={xAt(hoverIdx)} cy={yAt(v)}
                  r="3.5"
                  fill="#0F172A"
                  stroke={m.color}
                  strokeWidth="2"
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hoverIdx != null && (
        <Tooltip
          label={lab[hoverIdx] || ''}
          values={{
            joined:    j[hoverIdx],
            served:    s[hoverIdx],
            abandoned: a[hoverIdx],
          }}
          x={(xAt(hoverIdx) / W) * 100}
        />
      )}
    </div>
  );
}

function Tooltip({ label, values, x }) {
  // Position tooltip near the crosshair; clamp so it doesn't fall off the
  // edges. `x` is a percentage of chart width.
  const clampedX = Math.max(8, Math.min(92, x));
  const onRight = clampedX > 70;
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 min-w-[140px] rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
      style={{
        left:  onRight ? undefined : `calc(${clampedX}% + 10px)`,
        right: onRight ? `calc(${100 - clampedX}% + 10px)` : undefined,
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label || '—'}
      </p>
      <ul className="mt-1.5 space-y-1">
        {SERIES_META.map((m) => (
          <li key={m.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
              {m.label}
            </span>
            <span className="font-mono text-white">{values[m.key] ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.01] text-xs text-slate-500">
      Waiting for the first tickets to come in…
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Math helpers
// ──────────────────────────────────────────────────────────────────────

function padLeft(arr, n, fill = 0) {
  const src = Array.isArray(arr) ? arr : [];
  if (src.length >= n) return src.slice(-n);
  return new Array(n - src.length).fill(fill).concat(src);
}

// Rounds up to a "nice" axis ceiling — 1, 2, 5, 10, 20, 50, 100, ...
function niceCeil(n) {
  if (n <= 1) return 1;
  const exp = Math.floor(Math.log10(n));
  const base = Math.pow(10, exp);
  const norm = n / base;
  let nice;
  if      (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 5) nice = 5;
  else                nice = 10;
  return nice * base;
}

function buildYTicks(max) {
  if (max <= 4) {
    const out = [];
    for (let i = 0; i <= max; i += 1) out.push(i);
    return out;
  }
  return [0, Math.round(max / 4), Math.round(max / 2), Math.round((max * 3) / 4), max];
}

function pickIndices(len, count) {
  if (len <= count) return Array.from({ length: len }, (_, i) => i);
  const step = (len - 1) / (count - 1);
  const out = [];
  for (let i = 0; i < count; i += 1) out.push(Math.round(i * step));
  return out;
}

// ──────────────────────────────────────────────────────────────────────
//  Delta formatting
// ──────────────────────────────────────────────────────────────────────

function formatCountDelta(current, prev) {
  if (prev == null) return { label: '', dir: 'up' };
  const diff = (current ?? 0) - prev;
  if (diff === 0) return { label: 'flat vs prior', dir: 'flat' };
  const sign = diff > 0 ? '+' : '−';
  return { label: `${sign}${Math.abs(diff)} vs prior`, dir: diff > 0 ? 'up' : 'down' };
}

function formatMinutesDelta(current, prev) {
  if (prev == null || current == null) return { label: '', dir: 'flat' };
  const diff = current - prev;
  if (Math.abs(diff) < 0.5) return { label: 'on par with prior', dir: 'flat' };
  if (diff < 0) return { label: `${Math.abs(diff).toFixed(1)}m faster`, dir: 'down' };
  return { label: `${diff.toFixed(1)}m slower`, dir: 'up' };
}
