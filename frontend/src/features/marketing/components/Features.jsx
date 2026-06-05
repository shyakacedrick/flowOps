import Reveal from '@/features/marketing/components/Reveal';
import Stagger from '@/features/marketing/components/Stagger';
import { motion } from 'framer-motion';
import { cardHover } from '@/animations/motion';

const FEATURES = [
  {
    title: 'Smart Queue System',
    desc: 'Customers join queues digitally from any device and track their progress in real time — no paper tickets, no guesswork.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M4 6h16M4 12h10M4 18h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="18" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Updates',
    desc: 'Queue positions, wait times, and service status update instantly across every screen — no refreshing required.',
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
    title: 'Business Dashboard',
    desc: 'Monitor waiting times, customer flow, and counter performance in one unified, beautifully designed control center.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <rect x="3" y="3" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="12" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="16" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Smart Insights',
    desc: 'AI-driven operational insights, peak hour detection, and staffing recommendations — turn data into action.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="section">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">Features</span>
        <h2 className="h-section mt-5">
          Everything you need to run a calm, efficient front desk.
        </h2>
        <p className="mt-5 text-lg text-muted">
          Four core capabilities, designed to work together out of the box.
        </p>
      </Reveal>

      <Stagger className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4" stagger={0.09}>
        {FEATURES.map((f) => (
          <Stagger.Item key={f.title} className="h-full">
            <motion.div
              variants={cardHover}
              initial="rest"
              whileHover="hover"
              animate="rest"
              className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl hover:border-primary/30 hover:shadow-glow"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-primary/20 to-secondary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          </Stagger.Item>
        ))}
      </Stagger>
    </section>
  );
}
