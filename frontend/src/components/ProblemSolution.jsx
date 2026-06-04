const PAINS = [
  'Long, unpredictable waiting times',
  'Zero visibility into queue positions',
  'Poor tracking of service performance',
  'Frustrated customers & low retention',
];

const SOLUTIONS = [
  'Real-time queue tracking on every device',
  'Smart waiting time estimation',
  'Business analytics & live dashboards',
  'Higher throughput and better efficiency',
];

function Card({ tone, title, items }) {
  const isPain = tone === 'pain';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-8 backdrop-blur-xl ${
        isPain
          ? 'border-rose-500/15 bg-rose-500/[0.03]'
          : 'border-emerald-400/15 bg-emerald-400/[0.03]'
      }`}
    >
      <div
        className={`absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl ${
          isPain ? 'bg-rose-500/10' : 'bg-emerald-400/10'
        }`}
      />
      <p
        className={`eyebrow ${
          isPain
            ? '!border-rose-400/20 !text-rose-300'
            : '!border-emerald-400/20 !text-emerald-300'
        }`}
      >
        {isPain ? 'The Problem' : 'The Solution'}
      </p>
      <h3 className="mt-4 text-2xl font-bold text-white">{title}</h3>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-slate-300">
            <span
              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-sm ${
                isPain
                  ? 'bg-rose-500/15 text-rose-300'
                  : 'bg-emerald-400/15 text-emerald-300'
              }`}
            >
              {isPain ? '✕' : '✓'}
            </span>
            <span className="text-sm leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProblemSolution() {
  return (
    <section id="about" className="section">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">Why FlowOps</span>
        <h2 className="h-section mt-5">
          Service businesses are stuck in slow, opaque queues.
        </h2>
        <p className="mt-5 text-lg text-muted">
          We rebuilt the operations layer for clinics, banks, salons, and
          restaurants — bringing clarity to every minute of customer flow.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <Card tone="pain" title="What teams deal with today" items={PAINS} />
        <Card
          tone="solution"
          title="What FlowOps delivers"
          items={SOLUTIONS}
        />
      </div>
    </section>
  );
}
