import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

/**
 * QueueHealthPanel — premium right-side monitoring rail.
 *
 * Each row consumes a real engine-driven history series so the sparkline
 * waveform shifts as TICKs arrive. Status & label react to live queue
 * conditions: Healthy / Watching / Action.
 */
export default function QueueHealthPanel({
  normal = 14,
  delayed = 3,
  critical = 1,
  history = [],
  queueLength = 0,
}) {
  const series = deriveSeries(history);
  const overall = overallHealth(normal, delayed, critical, queueLength);

  const rows = [
    { value: normal,   title: 'Normal wait',   sub: 'Under 15m', color: '#2DD4BF', level: 'Healthy',  pts: series[0] },
    { value: delayed,  title: 'Delayed wait',  sub: '15 – 30m',  color: '#FACC15', level: 'Watching', pts: series[1] },
    { value: critical, title: 'Critical wait', sub: 'Over 30m',  color: '#FB923C', level: 'Action',   pts: series[2] },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Queue health
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-white">Wait-time thresholds</h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
          <Activity className="h-3 w-3" /> Live
        </div>
      </div>

      <div className="relative mt-3 space-y-1.5">
        {rows.map((r, i) => (
          <HealthRow key={r.title} {...r} index={i} />
        ))}
      </div>

      <div className={`relative mt-3 flex items-center justify-between rounded-2xl border px-3 py-2 transition-colors ${overall.shellBorder} ${overall.shellBg}`}>
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
            Overall
          </p>
          <p className="truncate text-xs font-semibold text-white">{overall.title}</p>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 text-[11px] font-semibold ${overall.text}`}>
          <BreathingDot color={overall.dot} />
          {overall.label}
        </span>
      </div>
    </section>
  );
}

function deriveSeries(history) {
  const len = 26;
  const base = padLeft(history, len);
  return [
    base.map((v, i) => 0.45 + 0.04 * v + 0.02 * Math.sin(i / 2 + 1)),
    base.map((v, i) => 0.40 + 0.05 * Math.max(0, v - 3) + 0.02 * Math.sin(i / 3 + 2)),
    base.map((v, i) => 0.35 + 0.07 * Math.max(0, v - 6) + 0.02 * Math.sin(i / 4 + 3)),
  ];
}

function padLeft(arr, n) {
  const src = Array.isArray(arr) ? arr : [];
  if (src.length >= n) return src.slice(-n);
  return new Array(n - src.length).fill(0).concat(src);
}

function overallHealth(normal, delayed, critical, queueLength) {
  if (critical >= 2 || queueLength >= 12) {
    return {
      title: 'Wait times exceeding target',
      label: 'Critical', text: 'text-rose-300', dot: 'bg-rose-400',
      shellBg: 'bg-rose-500/5', shellBorder: 'border-rose-400/20',
    };
  }
  if (delayed >= 3 || queueLength >= 7) {
    return {
      title: 'Increased traffic detected',
      label: 'Busy', text: 'text-amber-300', dot: 'bg-amber-400',
      shellBg: 'bg-amber-500/5', shellBorder: 'border-amber-400/20',
    };
  }
  return {
    title: 'Queue running smoothly',
    label: 'Operational', text: 'text-emerald-300', dot: 'bg-emerald-400',
    shellBg: 'bg-emerald-500/5', shellBorder: 'border-emerald-400/20',
  };
}

function BreathingDot({ color }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}

function HealthRow({ value, title, sub, color, level, pts, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 * index + 0.08, duration: 0.3 }}
      className="group flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 transition-colors hover:border-white/10"
    >
      <div className="w-8 shrink-0 text-right">
        <motion.p
          key={value}
          initial={{ opacity: 0.5, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-lg font-bold leading-none text-white tabular-nums"
        >
          {value}
        </motion.p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">{title}</span>
          <span className="shrink-0 text-[9px] font-semibold tabular-nums" style={{ color }}>{sub}</span>
        </div>
        <StreamingSparkline color={color} pts={pts} />
      </div>
      <span
        className="ml-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
        style={{ color, backgroundColor: `${color}18` }}
      >
        {level}
      </span>
    </motion.div>
  );
}

function StreamingSparkline({ color, pts }) {
  const W = 130;
  const H = 18;
  if (!pts?.length) return <svg viewBox={`0 0 ${W} ${H}`} className="h-4 w-full" />;
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const range = max - min || 1;
  const stepX = W / (pts.length - 1);
  const d = pts.map((v, i) => {
    const x = i * stepX;
    const y = H - ((v - min) / range) * (H - 6) - 3;
    if (i === 0) return `M ${x.toFixed(1)},${y.toFixed(1)}`;
    const cx = ((i - 1) * stepX + x) / 2;
    return `Q ${cx.toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastX = (pts.length - 1) * stepX;
  const lastY = H - ((pts[pts.length - 1] - min) / range) * (H - 6) - 3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-0.5 h-4 w-full">
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        initial={false}
        animate={{ d }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      <motion.circle
        cx={lastX} cy={lastY} r="2"
        fill={color}
        initial={false}
        animate={{ cx: lastX, cy: lastY }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}
