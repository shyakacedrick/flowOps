const METRICS = [
  {
    label: 'Peak Hours Detected',
    value: '12:30 – 14:00',
    delta: '+38% volume vs avg',
    tone: 'primary',
    chart: 'bars',
  },
  {
    label: 'Average Wait Time',
    value: '6m 12s',
    delta: '▼ 62% this month',
    tone: 'secondary',
    chart: 'line',
  },
  {
    label: 'Customers Served Today',
    value: '486',
    delta: '▲ 9% vs yesterday',
    tone: 'primary',
    chart: 'progress',
  },
  {
    label: 'Queue Efficiency Score',
    value: '94 / 100',
    delta: 'Top 5% of locations',
    tone: 'secondary',
    chart: 'donut',
  },
];

function MiniBars() {
  const bars = [40, 55, 70, 90, 95, 75, 50, 35];
  return (
    <div className="flex h-12 items-end gap-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-primary/60 to-secondary/60"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function MiniLine() {
  return (
    <svg viewBox="0 0 120 50" className="h-12 w-full">
      <defs>
        <linearGradient id="m-line" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,35 C20,30 30,15 50,18 C70,21 80,38 100,25 L120,15 L120,50 L0,50 Z"
        fill="url(#m-line)"
      />
      <path
        d="M0,35 C20,30 30,15 50,18 C70,21 80,38 100,25 L120,15"
        stroke="#06B6D4"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniProgress() {
  return (
    <div className="space-y-2">
      {[80, 65, 92].map((p, i) => (
        <div
          key={i}
          className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
            style={{ width: `${p}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function MiniDonut() {
  return (
    <div className="relative grid h-12 w-12 place-items-center">
      <div
        className="h-12 w-12 rounded-full"
        style={{
          background:
            'conic-gradient(#3B82F6 0 76%, #06B6D4 76% 94%, rgba(148,163,184,0.15) 94% 100%)',
        }}
      />
      <div className="absolute inset-1.5 grid place-items-center rounded-full bg-slate-950 text-[9px] font-semibold text-white">
        94
      </div>
    </div>
  );
}

function ChartFor({ chart }) {
  if (chart === 'bars') return <MiniBars />;
  if (chart === 'line') return <MiniLine />;
  if (chart === 'progress') return <MiniProgress />;
  return <MiniDonut />;
}

export default function InsightsEngine() {
  return (
    <section className="section">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          Insights Engine
        </span>
        <h2 className="h-section mt-5">
          The intelligence layer behind every queue.
        </h2>
        <p className="mt-5 text-lg text-muted">
          FlowOps quietly reads patterns from millions of customer interactions —
          and surfaces the metrics that move the business.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
          >
            <div
              className={`pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full blur-3xl opacity-50 transition-opacity duration-500 group-hover:opacity-100 ${
                m.tone === 'primary' ? 'bg-primary/15' : 'bg-secondary/15'
              }`}
            />
            <div className="relative">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {m.label}
                </p>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    m.tone === 'primary'
                      ? 'bg-primary shadow-[0_0_10px_#3B82F6]'
                      : 'bg-secondary shadow-[0_0_10px_#06B6D4]'
                  }`}
                />
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-white">
                {m.value}
              </p>
              <p
                className={`mt-1 text-xs font-medium ${
                  m.tone === 'primary' ? 'text-primary' : 'text-secondary'
                }`}
              >
                {m.delta}
              </p>
              <div className="mt-5 border-t border-white/[0.05] pt-4">
                <ChartFor chart={m.chart} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
