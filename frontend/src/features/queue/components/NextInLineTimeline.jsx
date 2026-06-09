import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';

const ITEMS = [
  { ticket: 'A-104', desk: 'Desk 2', eta: '4m',  tone: 'emerald', status: 'Ready'    },
  { ticket: 'B-211', desk: 'Desk 1', eta: '9m',  tone: 'violet',  status: 'On deck'  },
  { ticket: 'A-308', desk: 'Desk 3', eta: '15m', tone: 'slate',   status: 'Queued'   },
  { ticket: 'C-038', desk: 'Specialist', eta: '22m', tone: 'amber',  status: 'Queued'   },
  { ticket: 'A-106', desk: 'Desk 4', eta: '30m', tone: 'rose',    status: 'Reserved' },
];

const DOTS = {
  emerald: 'bg-emerald-500',
  violet:  'bg-violet-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  slate:   'bg-slate-500',
};

const STATUS_TONES = {
  Ready:    'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  'On deck':'bg-violet-500/10 text-violet-300 ring-violet-400/20',
  Queued:   'bg-white/[0.04] text-slate-300 ring-white/10',
  Reserved: 'bg-rose-500/10 text-rose-300 ring-rose-400/20',
};

export default function NextInLineTimeline({ items = ITEMS }) {
  return (
    <section className="rounded-3xl border border-white/[0.06] bg-slate-950/40 p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Upcoming queue sequence</h3>
          <p className="mt-0.5 text-xs text-slate-400">Predicted hand-offs across counters</p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((it, i) => (
          <motion.li
            key={it.ticket}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i + 0.1, duration: 0.3 }}
            className="group flex gap-4"
          >
            {/* ETA column */}
            <div className="w-14 shrink-0 pt-1 text-right">
              <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                <Clock className="h-3 w-3" /> {it.eta}
              </p>
            </div>

            {/* Timeline column */}
            <div className="relative flex-1 pl-4">
              <span className={`absolute -left-[3px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-slate-950 ${DOTS[it.tone] || DOTS.slate}`} />
              {i < items.length - 1 && (
                <span className="absolute left-0 top-5 h-full w-px bg-white/[0.08]" />
              )}

              <div className="rounded-2xl px-3 py-1.5 transition-colors group-hover:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-semibold tracking-tight text-white">
                      #{it.ticket}
                    </p>
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                    <p className="text-xs text-slate-400">{it.desk}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${STATUS_TONES[it.status] || STATUS_TONES.Queued}`}>
                    {it.status}
                  </span>
                </div>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
