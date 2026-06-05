import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Reveal from '@/features/marketing/components/Reveal';
import { ease } from '@/animations/motion';

const FAQS = [
  {
    q: 'Do I need new hardware to run FlowOps?',
    a: 'No. FlowOps runs in any modern browser — for ticket displays, the staff console, and customer self check-in. If you already have a tablet, a TV, or a phone, you have what you need.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. The Starter plan is free forever for a single location with one service line. You can upgrade to Pro the day your queues start needing more.',
  },
  {
    q: 'How does the smart insights engine actually work?',
    a: 'FlowOps continuously analyzes arrival rates, service times, and queue length. It surfaces peak hours, recommends staffing, and warns you before bottlenecks form — all derived from your own live data.',
  },
  {
    q: 'Can FlowOps integrate with our existing systems?',
    a: 'Pro and Enterprise plans expose a REST API and webhooks for ticketing, CRM, and identity providers. Enterprise customers get SSO, audit logs, and custom integrations.',
  },
  {
    q: 'Where is our data stored?',
    a: 'Customer data is encrypted in transit and at rest. Enterprise customers can choose region-specific hosting, private cloud, or on-prem deployment.',
  },
  {
    q: 'How long does it take to roll out across multiple branches?',
    a: 'Most multi-branch teams are live within two weeks. FlowOps includes templates, role-based access, and a guided onboarding flow built for operations leads — not engineers.',
  },
];

function FAQItem({ q, a, open, onToggle, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.4, ease: ease.out, delay: index * 0.05 }}
      className={`overflow-hidden rounded-2xl border bg-white/[0.02] backdrop-blur-xl transition-colors duration-300 ${
        open ? 'border-primary/30' : 'border-white/[0.08]'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-white sm:text-base">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: ease.out }}
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
            open
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-white/10 bg-white/[0.03] text-slate-400'
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: ease.out }}
          >
            <p className="px-6 pb-6 text-sm leading-relaxed text-slate-400">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section id="faq" className="section">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">FAQ</span>
        <h2 className="h-section mt-5">Questions, answered.</h2>
        <p className="mt-5 text-lg text-muted">
          Everything you need to know before you roll FlowOps out to your team.
        </p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-3xl gap-3">
        {FAQS.map((f, i) => (
          <FAQItem
            key={f.q}
            index={i}
            q={f.q}
            a={f.a}
            open={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
          />
        ))}
      </div>
    </section>
  );
}
