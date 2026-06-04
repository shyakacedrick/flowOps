import {
  Stethoscope,
  BriefcaseMedical,
  Scissors,
  Landmark,
  Utensils,
  Briefcase,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Stagger from './Stagger';
import Reveal from './Reveal';
import { cardHover } from '../animations/motion';

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

function IndustryCard({ industry }) {
  const { name, desc, Icon, metric, queue } = industry;
  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl transition-colors duration-500 hover:border-secondary/30 hover:shadow-glow-cyan"
    >
      {/* Glow on hover */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-secondary/15 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Top: identity */}
      <div className="relative p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-secondary/20 to-primary/10 text-secondary transition-all duration-500 group-hover:border-secondary/40 group-hover:text-white group-hover:shadow-glow-cyan">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-white">{name}</p>
            <p className="mt-0.5 text-sm text-slate-400">{desc}</p>
          </div>
        </div>
      </div>

      {/* Bottom: live preview, animates on hover */}
      <div
        className="grid overflow-hidden transition-[grid-template-rows] duration-500 ease-out"
        style={{ gridTemplateRows: '0fr' }}
      >
        {/* hidden state */}
      </div>
      <div className="grid grid-rows-[0fr] overflow-hidden transition-all duration-500 ease-out group-hover:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <div className="mx-6 mb-6 rounded-xl border border-white/[0.06] bg-slate-950/60 p-4 backdrop-blur-md">
            {/* metric row */}
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-0.5 text-lg font-bold text-white tabular-nums">
                  {metric.value}
                </p>
              </div>
              <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                {metric.delta}
              </span>
            </div>
            {/* mini queue */}
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Live queue
            </p>
            <ul className="mt-2 space-y-1">
              {queue.map((q) => (
                <li
                  key={q.id}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="flex items-center gap-2 text-slate-300">
                    <Dot t={q.t} />
                    <span className="font-mono text-slate-500">{q.id}</span>
                    <span className="text-slate-400">{q.l}</span>
                  </span>
                  <span
                    className={
                      q.t === 'live'
                        ? 'text-emerald-400'
                        : q.t === 'next'
                        ? 'text-secondary'
                        : 'text-slate-600'
                    }
                  >
                    {q.t === 'live' ? 'Serving' : q.t === 'next' ? 'Next' : 'Wait'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Industries() {
  return (
    <section id="solutions" className="section">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">Who It's For</span>
        <h2 className="h-section mt-5">
          One platform. Every service industry.
        </h2>
        <p className="mt-5 text-lg text-muted">
          Hover any industry to preview how FlowOps adapts to its workflow.
        </p>
      </Reveal>

      <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
        {INDUSTRIES.map((i) => (
          <Stagger.Item key={i.name}>
            <IndustryCard industry={i} />
          </Stagger.Item>
        ))}
      </Stagger>
    </section>
  );
}
