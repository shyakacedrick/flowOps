// Larger, full-width dashboard mockup for the Showcase section.

function BarChart() {
  const bars = [40, 65, 50, 80, 95, 70, 55, 88, 72, 60, 45, 35];
  return (
    <div className="flex h-40 items-end gap-2">
      {bars.map((h, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-md bg-gradient-to-t from-primary/70 to-secondary/70 transition-all duration-300 group-hover:from-primary group-hover:to-secondary"
            style={{ height: `${h}%` }}
          />
          <span className="text-[9px] text-slate-500">{8 + i}h</span>
        </div>
      ))}
    </div>
  );
}

function Donut() {
  // simple donut composed via conic-gradient
  return (
    <div className="relative grid h-32 w-32 place-items-center">
      <div
        className="h-32 w-32 rounded-full"
        style={{
          background:
            'conic-gradient(#3B82F6 0 62%, #06B6D4 62% 84%, rgba(148,163,184,0.15) 84% 100%)',
        }}
      />
      <div className="absolute inset-3 grid place-items-center rounded-full bg-slate-950">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">84%</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            On-time
          </p>
        </div>
      </div>
    </div>
  );
}

function FloatingLabel({ title, value, className = '', tone = 'primary' }) {
  const dot = tone === 'primary' ? 'bg-primary' : 'bg-secondary';
  const glow =
    tone === 'primary' ? 'shadow-glow' : 'shadow-glow-cyan';
  return (
    <div
      className={`absolute hidden animate-float rounded-xl border border-white/10 bg-bg/80 px-3.5 py-2.5 text-xs backdrop-blur-xl sm:block ${glow} ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <p className="text-[10px] uppercase tracking-wider text-slate-400">
          {title}
        </p>
      </div>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function DashboardShowcase() {
  return (
    <section id="dashboard" className="section">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">The Dashboard</span>
        <h2 className="h-section mt-5">One screen. Total operational clarity.</h2>
        <p className="mt-5 text-lg text-muted">
          Every wait, every counter, every customer — visible and measurable in
          real time.
        </p>
      </div>

      <div className="relative mt-16">
        {/* outer glow */}
        <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/15 via-secondary/10 to-transparent blur-3xl" />

        <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-3 shadow-2xl backdrop-blur-xl sm:p-5">
          {/* window chrome */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-400">
              app.flowops.io / operations
            </div>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live data
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 p-3 sm:p-5">
            {/* Sidebar */}
            <div className="col-span-12 space-y-2 sm:col-span-2">
              {['Overview', 'Queues', 'Counters', 'Analytics', 'Team'].map(
                (n, i) => (
                  <div
                    key={n}
                    className={`rounded-lg px-3 py-2 text-xs ${
                      i === 0
                        ? 'border border-primary/30 bg-primary/10 text-white'
                        : 'text-slate-400 hover:bg-white/[0.03]'
                    }`}
                  >
                    {n}
                  </div>
                )
              )}
            </div>

            {/* Main */}
            <div className="col-span-12 space-y-4 sm:col-span-10">
              {/* KPI Row */}
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { l: 'Avg Wait', v: '6m 12s', d: '▼ 18%' },
                  { l: 'Served Today', v: '486', d: '▲ 9%' },
                  { l: 'Active Counters', v: '8 / 10', d: '● Healthy' },
                  { l: 'Satisfaction', v: '4.8 / 5', d: '▲ 0.3' },
                ].map((k) => (
                  <div
                    key={k.l}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      {k.l}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">{k.v}</p>
                    <p className="mt-1 text-[11px] font-medium text-emerald-400">
                      {k.d}
                    </p>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 lg:col-span-2">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">
                      Customer Flow Today
                    </p>
                    <div className="flex gap-1 text-[10px] text-slate-500">
                      {['1H', '24H', '7D', '30D'].map((p, i) => (
                        <span
                          key={p}
                          className={`rounded px-2 py-0.5 ${
                            i === 1
                              ? 'bg-primary/15 text-primary'
                              : 'hover:text-slate-300'
                          }`}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <BarChart />
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="mb-3 text-sm font-semibold text-white">
                    Service SLA
                  </p>
                  <div className="flex items-center justify-center">
                    <Donut />
                  </div>
                  <div className="mt-3 flex justify-around text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-primary" /> Under 5m
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-secondary" /> 5–10m
                    </span>
                  </div>
                </div>
              </div>

              {/* Counter rows */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-3 text-sm font-semibold text-white">
                  Counter Performance
                </p>
                <div className="space-y-2.5">
                  {[
                    { c: 'Counter 1', s: 'Aisha M.', t: 92 },
                    { c: 'Counter 2', s: 'Daniel K.', t: 78 },
                    { c: 'Counter 3', s: 'Priya S.', t: 65 },
                    { c: 'Counter 4', s: 'Omar L.', t: 88 },
                  ].map((r) => (
                    <div
                      key={r.c}
                      className="flex items-center gap-3 text-xs"
                    >
                      <span className="w-20 text-slate-300">{r.c}</span>
                      <span className="w-24 text-slate-500">{r.s}</span>
                      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${r.t}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-slate-400">
                        {r.t}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating labels */}
        <FloatingLabel
          title="Peak Hours Detected"
          value="12:30 — 14:00"
          tone="secondary"
          className="-left-6 top-24"
        />
        <FloatingLabel
          title="Average Wait Time"
          value="6m 12s ▼"
          tone="primary"
          className="-right-4 top-1/3"
        />
        <FloatingLabel
          title="Customers Served Today"
          value="486 people"
          tone="secondary"
          className="-left-4 bottom-16"
        />
      </div>
    </section>
  );
}
