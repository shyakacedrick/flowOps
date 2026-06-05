import Reveal from '@/features/marketing/components/Reveal';
import Stagger from '@/features/marketing/components/Stagger';

const STEPS = [
  {
    n: '01',
    title: 'Customers Join Queue',
    desc: 'A quick scan or tap puts customers in line — from their phone, a kiosk, or the web.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <rect x="6" y="3" width="12" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Businesses Manage Flow',
    desc: 'Staff serve, route, and prioritize customers from a single intuitive control panel.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M4 6h16M4 12h16M4 18h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    n: '03',
    title: 'FlowOps Generates Insights',
    desc: 'Live dashboards, peak detection, and reports — so every decision is data-driven.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M3 17l5-5 4 4 8-8M14 8h7v7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="section">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">How It Works</span>
        <h2 className="h-section mt-5">Three steps from queue to insight.</h2>
        <p className="mt-5 text-lg text-muted">
          Designed to feel invisible to customers and effortless for staff.
        </p>
      </div>

      <div className="relative mt-16">
        {/* Connector line */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px lg:block"
          style={{
            background:
              'linear-gradient(to right, transparent 5%, rgba(59,130,246,0.4) 20%, rgba(6,182,212,0.4) 50%, rgba(59,130,246,0.4) 80%, transparent 95%)',
          }}
        />

        <Stagger className="grid gap-6 lg:grid-cols-3" stagger={0.12}>
          {STEPS.map((s, i) => (
            <Stagger.Item key={s.n}>
            <div className="relative">
              <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow">
                <div className="flex items-center gap-3">
                  <div className="relative grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-primary/25 to-secondary/15 text-primary shadow-glow">
                    {s.icon}
                  </div>
                  <span className="font-mono text-xs tracking-widest text-slate-500">
                    STEP {s.n}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {s.desc}
                </p>
              </div>

              {/* arrow between steps (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="pointer-events-none absolute -right-3 top-12 hidden lg:block">
                  <div className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-bg text-secondary">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            </Stagger.Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
