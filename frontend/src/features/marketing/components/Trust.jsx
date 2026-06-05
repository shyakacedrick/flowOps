const PILLARS = [
  {
    title: 'Secure Authentication',
    desc: 'SSO, role-based access, and end-to-end encryption — trusted in regulated environments.',
    badge: 'SOC 2 ready',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Synchronization',
    desc: 'Every counter, screen, and customer device stays perfectly in sync — under 200ms.',
    badge: '< 200ms latency',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M3 12a9 9 0 0114.65-7M21 12a9 9 0 01-14.65 7M21 5v4h-4M3 19v-4h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Reliable Operations Tracking',
    desc: '99.99% uptime, redundant infrastructure, and continuous audit logs you can rely on.',
    badge: '99.99% uptime',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M3 12l4-8 4 16 4-12 4 8h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Trust() {
  return (
    <section className="section">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
        {/* Left */}
        <div className="lg:col-span-5">
          <span className="eyebrow">Built to be trusted</span>
          <h2 className="h-section mt-5">
            Operations-grade reliability, by default.
          </h2>
          <p className="mt-5 text-lg text-muted">
            FlowOps sits at the front line of your business. We engineer it like
            critical infrastructure — because that's exactly what it is.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { v: '99.99%', l: 'Uptime SLA' },
              { v: 'SOC 2', l: 'Type II ready' },
              { v: 'AES-256', l: 'Encryption' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 backdrop-blur-xl"
              >
                <p className="text-base font-bold text-white sm:text-lg">{s.v}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right pillars */}
        <div className="space-y-4 lg:col-span-7">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-primary/20 to-secondary/10 text-primary">
                  {p.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {p.title}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      {p.badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                    {p.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
