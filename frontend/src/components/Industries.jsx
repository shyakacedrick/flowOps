import { useEffect, useState } from 'react';
import {
  Stethoscope,
  BriefcaseMedical,
  Scissors,
  Landmark,
  Utensils,
  Briefcase,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Stagger from './Stagger';
import Reveal from './Reveal';

const INDUSTRIES = [
  {
    name: 'Clinics',
    desc: 'Patient flow, triage, and exam-room visibility.',
    Icon: Stethoscope,
    metric: { label: 'Avg wait', value: '6m', delta: '▼ 38%' },
    queue: [
      { id: 'P-014', l: 'Triage', t: 'live' },
      { id: 'P-015', l: 'Exam 2', t: 'next' },
      { id: 'P-016', l: 'Exam 1', t: 'wait' },
    ],
  },
  {
    name: 'Hospitals',
    desc: 'Multi-department queues with priority routing.',
    Icon: BriefcaseMedical,
    metric: { label: 'Departments', value: '12', delta: '● live' },
    queue: [
      { id: 'ER-22', l: 'Emergency', t: 'live' },
      { id: 'RD-08', l: 'Radiology', t: 'next' },
      { id: 'PH-31', l: 'Pharmacy', t: 'wait' },
    ],
  },
  {
    name: 'Salons',
    desc: 'Appointments, walk-ins, and stylist load balance.',
    Icon: Scissors,
    metric: { label: 'Chairs busy', value: '8/10', delta: '▲ 92%' },
    queue: [
      { id: 'S-104', l: 'Color', t: 'live' },
      { id: 'S-105', l: 'Cut', t: 'next' },
      { id: 'S-106', l: 'Style', t: 'wait' },
    ],
  },
  {
    name: 'Banks',
    desc: 'Counter routing and KYC service workflows.',
    Icon: Landmark,
    metric: { label: 'Avg wait', value: '4m', delta: '▼ 22%' },
    queue: [
      { id: 'B-201', l: 'Teller 03', t: 'live' },
      { id: 'B-202', l: 'KYC', t: 'next' },
      { id: 'B-203', l: 'Loans', t: 'wait' },
    ],
  },
  {
    name: 'Restaurants',
    desc: 'Waitlists, table turnover, and host-stand flow.',
    Icon: Utensils,
    metric: { label: 'Tables open', value: '7', delta: '▲ flow' },
    queue: [
      { id: 'T-12', l: 'Party of 2', t: 'live' },
      { id: 'T-13', l: 'Party of 4', t: 'next' },
      { id: 'T-14', l: 'Party of 6', t: 'wait' },
    ],
  },
  {
    name: 'Government Offices',
    desc: 'Visitor check-in, service-desk routing, and SLA tracking.',
    Icon: Briefcase,
    metric: { label: 'SLA met', value: '96%', delta: '▲ 4 pts' },
    queue: [
      { id: 'G-091', l: 'Passport', t: 'live' },
      { id: 'G-092', l: 'ID Renewal', t: 'next' },
      { id: 'G-093', l: 'Records', t: 'wait' },
    ],
  },
];

function Dot({ t }) {
  const map = {
    live: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
    next: 'bg-secondary',
    wait: 'bg-slate-600',
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${map[t]}`} />;
}

function IndustryChip({ industry, isActive, onSelect }) {
  const { name, Icon } = industry;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-300 ${
        isActive
          ? 'border-secondary/40 bg-white/[0.04]'
          : 'border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.03]'
      }`}
    >
      {/* Migrating spotlight ring */}
      {isActive && (
        <motion.span
          layoutId="industry-spotlight"
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-secondary/50 shadow-[0_0_40px_-8px_rgba(34,211,238,0.45)]"
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        />
      )}

      <span
        className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all duration-300 ${
          isActive
            ? 'border-secondary/40 bg-gradient-to-br from-secondary/25 to-primary/15 text-white shadow-glow-cyan'
            : 'border-white/10 bg-white/[0.03] text-slate-400 group-hover:text-secondary'
        }`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm font-semibold transition-colors ${
            isActive ? 'text-white' : 'text-slate-300'
          }`}
        >
          {name}
        </span>
      </span>

      <span
        className={`relative h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${
          isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-slate-700'
        }`}
      />
    </button>
  );
}

function IndustryDetail({ industry }) {
  const { name, desc, Icon, metric, queue } = industry;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-7 backdrop-blur-xl"
    >
      {/* Animated glows */}
      <motion.div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity, delay: 0.6 }}
      />

      {/* Header */}
      <div className="relative flex items-start gap-5">
        <motion.div
          initial={{ rotate: -8, scale: 0.85 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/25 to-primary/15 text-white shadow-glow-cyan"
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Industry · Live preview
          </p>
          <h3 className="mt-1 text-2xl font-bold text-white">{name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
        </div>
      </div>

      {/* Metric strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="relative mt-6 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-slate-950/50 px-5 py-4 backdrop-blur-md"
      >
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{metric.label}</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-white">{metric.value}</p>
        </div>
        <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          {metric.delta}
        </span>
      </motion.div>

      {/* Live queue */}
      <div className="relative mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Live queue
        </p>
        <ul className="mt-3 space-y-2">
          {queue.map((q, i) => (
            <motion.li
              key={q.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.07, duration: 0.35, ease: 'easeOut' }}
              className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-2.5"
            >
              <span className="flex items-center gap-3 text-xs">
                <Dot t={q.t} />
                <span className="font-mono text-slate-500">{q.id}</span>
                <span className="text-slate-300">{q.l}</span>
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  q.t === 'live'
                    ? 'text-emerald-400'
                    : q.t === 'next'
                    ? 'text-secondary'
                    : 'text-slate-500'
                }`}
              >
                {q.t === 'live' ? 'Serving' : q.t === 'next' ? 'Next' : 'Wait'}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function Industries() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [userLocked, setUserLocked] = useState(false);

  // Auto-cycle through industries until the user clicks one
  useEffect(() => {
    if (userLocked) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % INDUSTRIES.length);
    }, 3200);
    return () => clearInterval(id);
  }, [userLocked]);

  const handleSelect = (i) => {
    setUserLocked(true);
    setActiveIdx(i);
  };

  const active = INDUSTRIES[activeIdx];

  return (
    <section id="solutions" className="section">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">Who It's For</span>
        <h2 className="h-section mt-5">One platform. Every service industry.</h2>
        <p className="mt-5 text-lg text-muted">
          Pick an industry — the live preview adapts instantly.
        </p>
      </Reveal>

      <Stagger className="mt-14 grid gap-6 lg:grid-cols-12" stagger={0.05}>
        {/* Selector column */}
        <Stagger.Item className="lg:col-span-5">
          <div className="space-y-2">
            {INDUSTRIES.map((i, idx) => (
              <IndustryChip
                key={i.name}
                industry={i}
                isActive={idx === activeIdx}
                onSelect={() => handleSelect(idx)}
              />
            ))}
          </div>

          {!userLocked && (
            <div className="mt-4 flex items-center gap-2 px-1 text-[11px] text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-secondary" />
              </span>
              Auto-cycling · click any to lock
            </div>
          )}
        </Stagger.Item>

        {/* Detail panel */}
        <Stagger.Item className="lg:col-span-7">
          <div className="relative min-h-[420px]">
            <AnimatePresence mode="wait">
              <IndustryDetail key={active.name} industry={active} />
            </AnimatePresence>
          </div>
        </Stagger.Item>
      </Stagger>
    </section>
  );
}
