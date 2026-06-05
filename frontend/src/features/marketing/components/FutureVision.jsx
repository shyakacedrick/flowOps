const CURRENT = [
  {
    title: 'Queue Management',
    desc: 'Digital tickets, smart routing, and live floor control — shipped and battle-tested.',
  },
  {
    title: 'Business Analytics',
    desc: 'Real-time KPIs, peak detection, and performance reporting across locations.',
  },
];

const SOON = [
  {
    title: 'AI Demand Forecasting',
    desc: 'Predict queue volume and staff requirements hours in advance.',
  },
  {
    title: 'WhatsApp Notifications',
    desc: 'Reach customers where they already are — with zero app downloads.',
  },
  {
    title: 'Multi-Branch Management',
    desc: 'Unified operations across every location, from a single console.',
  },
  {
    title: 'Mobile App',
    desc: 'Native iOS & Android apps for staff and customers on the go.',
  },
];

function Pill({ children, tone = 'primary' }) {
  const map = {
    primary: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    secondary: 'border-secondary/30 bg-secondary/10 text-secondary',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${map}`}>
      {children}
    </span>
  );
}

function Card({ title, desc, status }) {
  const isShipped = status === 'shipped';
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/15 hover:shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {isShipped ? (
          <Pill tone="primary">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Shipped
          </Pill>
        ) : (
          <Pill tone="secondary">Coming Soon</Pill>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>

      {/* Timeline tick mark */}
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={`h-full rounded-full ${
            isShipped
              ? 'w-full bg-gradient-to-r from-emerald-400 to-emerald-500'
              : 'w-1/3 bg-gradient-to-r from-secondary to-primary'
          }`}
        />
      </div>
    </div>
  );
}

export default function FutureVision() {
  return (
    <section id="roadmap" className="section">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">Roadmap</span>
        <h2 className="h-section mt-5">
          We're building the operating system for service.
        </h2>
        <p className="mt-5 text-lg text-muted">
          What's live today, and where we're going next.
        </p>
      </div>

      <div className="mt-14 space-y-12">
        {/* Current */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34D399]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              Available now
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-emerald-400/30 to-transparent" />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {CURRENT.map((c) => (
              <Card key={c.title} {...c} status="shipped" />
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_10px_#06B6D4]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">
              Coming soon
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-secondary/30 to-transparent" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SOON.map((c) => (
              <Card key={c.title} {...c} status="soon" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
