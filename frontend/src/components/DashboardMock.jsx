import { useEffect, useRef, useState } from 'react';

/* ─────────────────── Live simulation engine ─────────────────── */

const NAME_POOL = [
  'Aisha M.', 'Daniel K.', 'Priya S.', 'Omar L.', 'Maya C.',
  'Tobi A.', 'Sara N.', 'Liam P.', 'Noor F.', 'Yara T.',
  'Ben R.', 'Mei L.', 'Kofi A.', 'Zara H.', 'Ravi S.',
];

const SERVICES = ['Consultation', 'Lab Pickup', 'Billing', 'Pharmacy', 'Triage'];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nextTicket(prev) {
  const n = parseInt(prev.slice(2), 10) + 1;
  return `A-${n.toString().padStart(3, '0')}`;
}

function makePerson(ticket) {
  return {
    id: ticket,
    name: NAME_POOL[rand(0, NAME_POOL.length - 1)],
    svc: SERVICES[rand(0, SERVICES.length - 1)],
    eta: rand(2, 18),
  };
}

/* ─────────────────── Number animation ─────────────────── */

function AnimatedNumber({ value, decimals = 0, duration = 600, suffix = '' }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const start = useRef(null);
  const raf = useRef();

  useEffect(() => {
    from.current = display;
    start.current = null;
    const tick = (ts) => {
      if (start.current == null) start.current = ts;
      const p = Math.min(1, (ts - start.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from.current + (value - from.current) * eased;
      setDisplay(decimals > 0 ? Number(next.toFixed(decimals)) : Math.round(next));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

/* ─────────────────── Sparkline (animated) ─────────────────── */

function Sparkline({ points }) {
  // points: array of 12 numbers (0..100) - newest at the end
  const w = 300;
  const h = 90;
  const step = w / (points.length - 1);
  const toY = (v) => h - (v / 100) * (h - 12) - 6;
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${toY(p)}`)
    .join(' ');
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  const lastX = (points.length - 1) * step;
  const lastY = toY(points[points.length - 1]);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <defs>
        <linearGradient id="dm-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dm-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {[20, 40, 60, 80].map((y) => (
        <line
          key={y}
          x1="0"
          x2={w}
          y1={y}
          y2={y}
          stroke="rgba(148,163,184,0.08)"
          strokeDasharray="2 4"
        />
      ))}
      <path
        d={area}
        fill="url(#dm-area)"
        style={{ transition: 'd 700ms ease-out' }}
      />
      <path
        d={path}
        fill="none"
        stroke="url(#dm-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'd 700ms ease-out' }}
      />
      <circle cx={lastX} cy={lastY} r="3.5" fill="#06B6D4">
        <animate attributeName="r" values="3.5;4.5;3.5" dur="1.4s" repeatCount="indefinite" />
      </circle>
      <circle cx={lastX} cy={lastY} r="7" fill="#06B6D4" opacity="0.25">
        <animate attributeName="r" values="6;12;6" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0;0.35" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─────────────────── Status pill ─────────────────── */

function ToneDot({ tone }) {
  const map = {
    live: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]',
    next: 'bg-secondary',
    wait: 'bg-slate-500',
  };
  return <span className={`h-2 w-2 rounded-full ${map[tone]}`} />;
}

/* ─────────────────── Main component ─────────────────── */

export default function DashboardMock() {
  // Initial queue
  const [queue, setQueue] = useState(() => {
    const start = 104;
    return Array.from({ length: 4 }, (_, i) =>
      makePerson(`A-${(start + i).toString().padStart(3, '0')}`)
    );
  });
  const [served, setServed] = useState(312);
  const [avgWait, setAvgWait] = useState(8.4); // minutes
  const [history, setHistory] = useState(() =>
    Array.from({ length: 12 }, () => rand(30, 80))
  );
  const [pulse, setPulse] = useState(0); // forces "now serving" re-render flash

  // Tick 1: advance the queue (serve current, add new) every 3.5s
  useEffect(() => {
    const id = setInterval(() => {
      setQueue((prev) => {
        if (prev.length === 0) return prev;
        const lastId = prev[prev.length - 1].id;
        const incoming = makePerson(nextTicket(lastId));
        return [...prev.slice(1), incoming];
      });
      setServed((s) => s + rand(1, 2));
      setPulse((p) => p + 1);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // Tick 2: drift avg wait & extend sparkline every 2.2s
  useEffect(() => {
    const id = setInterval(() => {
      setAvgWait((w) => {
        const next = w + (Math.random() - 0.5) * 0.6;
        return Math.max(5.5, Math.min(11.5, Number(next.toFixed(1))));
      });
      setHistory((h) => {
        const last = h[h.length - 1];
        const next = Math.max(20, Math.min(95, last + rand(-12, 12)));
        return [...h.slice(1), next];
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const nowServing = queue[0];
  const inQueue = queue.length + rand(18, 22); // simulate broader queue

  // Format avg wait as Xm Ys
  const m = Math.floor(avgWait);
  const s = Math.round((avgWait - m) * 60);

  return (
    <div className="relative">
      {/* Glow behind */}
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-primary/20 via-secondary/10 to-transparent blur-2xl" />

      <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-4 shadow-2xl backdrop-blur-xl">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-400">
            app.flowops.io / dashboard
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3 p-3">
          {/* KPI: Avg Wait */}
          <div className="col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Avg Wait</p>
            <p className="mt-1 text-xl font-bold text-white">
              <AnimatedNumber value={m} />m{' '}
              <AnimatedNumber value={s} />s
            </p>
            <p className="mt-1 text-[10px] font-medium text-emerald-400">
              ▼ 15m vs last week
            </p>
          </div>

          {/* KPI: In Queue */}
          <div className="col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">In Queue</p>
            <p className="mt-1 text-xl font-bold text-white">
              <AnimatedNumber value={inQueue} />
            </p>
            <p className="mt-1 text-[10px] font-medium text-secondary">● 6 active counters</p>
          </div>

          {/* KPI: Served Today */}
          <div className="col-span-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Served Today</p>
            <p className="mt-1 text-xl font-bold text-white">
              <AnimatedNumber value={served} duration={800} />
            </p>
            <p className="mt-1 text-[10px] font-medium text-primary">▲ 12% vs avg</p>
          </div>

          {/* Chart */}
          <div className="col-span-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:col-span-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-300">Hourly Flow</p>
              <div className="flex gap-1 text-[10px] text-slate-500">
                {['1H', '24H', '7D'].map((p, i) => (
                  <span
                    key={p}
                    className={`rounded px-1.5 py-0.5 ${
                      i === 1 ? 'bg-primary/15 text-primary' : 'hover:text-slate-300'
                    }`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-24">
              <Sparkline points={history} />
            </div>
          </div>

          {/* Live Queue list */}
          <div className="col-span-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:col-span-2">
            <p className="mb-2 text-xs font-semibold text-slate-300">Live Queue</p>
            <ul className="space-y-1.5">
              {queue.map((q, i) => {
                const tone = i === 0 ? 'live' : i === 1 ? 'next' : 'wait';
                const status =
                  i === 0 ? 'Now Serving' : i === 1 ? `~ ${q.eta} min` : `~ ${q.eta} min`;
                return (
                  <li
                    key={q.id}
                    className="flex animate-fade-in items-center justify-between rounded-md px-1.5 py-1 text-[11px] hover:bg-white/[0.03]"
                  >
                    <span className="flex items-center gap-2 text-slate-300">
                      <ToneDot tone={tone} />
                      <span className="font-mono text-slate-500">{q.id}</span>
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        tone === 'live'
                          ? 'text-emerald-400'
                          : tone === 'next'
                          ? 'text-secondary'
                          : 'text-slate-500'
                      }`}
                    >
                      {status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Floating "Now Serving" chip — re-pulses each tick */}
      <div
        key={pulse}
        className="absolute -left-4 top-1/3 hidden animate-slide-up rounded-xl border border-white/10 bg-bg/85 px-3 py-2 text-xs shadow-glow-cyan backdrop-blur-xl sm:block"
      >
        <p className="text-[10px] uppercase tracking-wider text-secondary">Now serving</p>
        <p className="font-mono text-sm font-semibold text-white">
          {nowServing?.id}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">{nowServing?.name}</p>
      </div>
    </div>
  );
}
