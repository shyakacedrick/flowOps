import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Reveal from '@/features/marketing/components/Reveal';
import Stagger from '@/features/marketing/components/Stagger';
import { cardHover, ease } from '@/animations/motion';

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    cadence: '/ forever',
    tagline: 'For solo operators getting their first queue online.',
    features: [
      '1 location · 1 service line',
      'Digital tickets & live screen',
      'Basic analytics (last 7 days)',
      'Email support',
    ],
    cta: 'Start free',
    to: '/signup',
  },
  {
    name: 'Pro',
    price: '$49',
    cadence: '/ location / month',
    tagline: 'For growing service businesses that live in their dashboard.',
    featured: true,
    features: [
      'Unlimited service lines',
      'Real-time analytics & peak detection',
      'Smart Insights & recommendations',
      'Staff & customer mobile access',
      'Priority chat support',
    ],
    cta: 'Start 14-day trial',
    to: '/signup',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '/ tailored',
    tagline: 'For multi-branch operators and regulated industries.',
    features: [
      'Multi-location command center',
      'SLA tracking & custom reports',
      'SSO, audit logs, role-based access',
      'On-prem or private cloud option',
      'Dedicated success manager',
    ],
    cta: 'Talk to sales',
    to: '/book-demo',
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="section">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">
          <Sparkles className="h-3.5 w-3.5" />
          Pricing
        </span>
        <h2 className="h-section mt-5">
          Simple plans. Built around your locations.
        </h2>
        <p className="mt-5 text-lg text-muted">
          Start free. Upgrade when your queues get serious. No hidden fees.
        </p>
        <p className="mt-3 text-xs uppercase tracking-widest text-slate-500">
          Pricing shown is indicative · self-serve billing rolls out soon
        </p>
      </Reveal>

      <Stagger className="mt-14 grid gap-5 lg:grid-cols-3" stagger={0.1}>
        {PLANS.map((p) => (
          <Stagger.Item key={p.name} className="h-full">
            <motion.div
              variants={cardHover}
              initial="rest"
              whileHover="hover"
              animate="rest"
              className={`relative flex h-full flex-col rounded-2xl border bg-white/[0.02] p-7 backdrop-blur-xl ${
                p.featured
                  ? 'border-primary/40 shadow-glow-lg'
                  : 'border-white/[0.08]'
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-glow">
                  Most popular
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-300">{p.name}</p>
                <p className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white tabular-nums">
                    {p.price}
                  </span>
                  <span className="text-xs text-slate-500">{p.cadence}</span>
                </p>
                <p className="mt-3 text-sm text-slate-400">{p.tagline}</p>
              </div>

              <ul className="mt-6 flex-1 space-y-2.5 border-t border-white/[0.06] pt-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span
                      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                        p.featured
                          ? 'bg-primary/20 text-primary'
                          : 'bg-white/[0.05] text-slate-400'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15, ease: ease.out }}
                className="mt-7"
              >
                <Link
                  to={p.to}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    p.featured
                      ? 'bg-primary text-white shadow-glow hover:bg-blue-500'
                      : 'border border-white/10 bg-white/[0.04] text-white hover:border-white/20'
                  }`}
                >
                  {p.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            </motion.div>
          </Stagger.Item>
        ))}
      </Stagger>
    </section>
  );
}
