const BEFORE = [
  { t: 'Long, unpredictable waiting times', m: '24m avg wait' },
  { t: 'Manual paper-ticket queues', m: 'No tracking' },
  { t: 'Frustrated, uninformed customers', m: '↓ Satisfaction' },
  { t: 'No operational insights', m: 'Decisions on gut' },
];

const AFTER = [
  { t: 'Real-time queue visibility on every device', m: 'Live status' },
  { t: 'Smart waiting time estimation', m: '±60s accuracy' },
  { t: 'Faster, smoother service flow', m: '6m avg wait' },
  { t: 'Actionable business intelligence', m: '24/7 analytics' },
];

function Row({ tone, item }) {
  const isBefore = tone === 'before';
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3.5 transition-colors hover:bg-white/[0.03]">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold ${
            isBefore
              ? 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20'
              : 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20'
          }`}
        >
          {isBefore ? '✕' : '✓'}
        </span>
        <span className="text-sm text-slate-200">{item.t}</span>
      </div>
      <span
        className={`hidden font-mono text-[10px] uppercase tracking-wider sm:inline ${
          isBefore ? 'text-rose-300/70' : 'text-emerald-300/80'
        }`}
      >
        {item.m}
      </span>
    </li>
  );
}

export default function BeforeAfter() {
  return (
    <section id="about" className="section">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">Before vs After</span>
        <h2 className="h-section mt-5">
          The difference is measurable on day one.
        </h2>
        <p className="mt-5 text-lg text-muted">
          What changes when chaotic queues become a clear, intelligent
          operational layer.
        </p>
      </div>

      <div className="relative mt-14 grid gap-6 md:grid-cols-2">
        {/* BEFORE */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/15 bg-gradient-to-b from-rose-500/[0.04] to-transparent p-7 backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-rose-300">
                Before FlowOps
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-rose-300/70">
                Traditional ops
              </span>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">
              Friction at every step.
            </h3>
            <ul className="mt-6 space-y-2.5">
              {BEFORE.map((b) => (
                <Row key={b.t} tone="before" item={b} />
              ))}
            </ul>
          </div>
        </div>

        {/* Center connector (desktop) */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
        >
          <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-bg text-secondary shadow-glow">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* AFTER */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-400/15 bg-gradient-to-b from-emerald-400/[0.04] to-transparent p-7 backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-300">
                After FlowOps
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-300/80">
                Modern ops
              </span>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">
              Clarity at every step.
            </h3>
            <ul className="mt-6 space-y-2.5">
              {AFTER.map((a) => (
                <Row key={a.t} tone="after" item={a} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
