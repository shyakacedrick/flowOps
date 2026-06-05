import { useInView } from '@/shared/hooks/useInView.js';
import { useCountUp } from '@/shared/hooks/useCountUp.js';

const STATS = [
  {
    target: 15,
    suffix: 'm',
    label: 'Average Wait Reduction',
    sub: 'Across pilot deployments',
    accent: 'from-primary/30 to-primary/0',
  },
  {
    target: 92,
    suffix: '%',
    label: 'Queue Transparency',
    sub: 'Customers see real-time progress',
    accent: 'from-secondary/30 to-secondary/0',
  },
  {
    target: 3,
    suffix: '×',
    label: 'Service Efficiency Improvement',
    sub: 'Compared to manual queues',
    accent: 'from-blue-500/30 to-blue-500/0',
  },
];

function StatCard({ stat, active }) {
  const value = useCountUp(stat.target, { active, duration: 1600 });
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/15 hover:shadow-glow">
      <div
        className={`pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-b ${stat.accent} blur-3xl opacity-60 transition-opacity duration-500 group-hover:opacity-100`}
      />
      <p className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
        <span className="tabular-nums">{value}</span>
        {stat.suffix}
      </p>
      <p className="mt-3 text-base font-semibold text-white">{stat.label}</p>
      <p className="mt-1 text-sm text-slate-400">{stat.sub}</p>
    </div>
  );
}

export default function LiveStats() {
  const [ref, inView] = useInView({ threshold: 0.3 });
  return (
    <section ref={ref} className="section !py-16">
      <div className="grid gap-5 md:grid-cols-3">
        {STATS.map((s) => (
          <StatCard key={s.label} stat={s} active={inView} />
        ))}
      </div>
    </section>
  );
}
