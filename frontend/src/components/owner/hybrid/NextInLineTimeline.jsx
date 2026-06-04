import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';

const ITEMS = [
  { ticket: 'A-104', desk: 'Desk 2', eta: '4m',  tone: 'sky',     status: 'Ready'    },
  { ticket: 'B-211', desk: 'Desk 1', eta: '9m',  tone: 'violet',  status: 'On deck'  },
  { ticket: 'A-308', desk: 'Desk 3', eta: '15m', tone: 'emerald', status: 'Queued'   },
  { ticket: 'C-038', desk: 'Specialist', eta: '22m', tone: 'amber',  status: 'Queued'   },
  { ticket: 'A-106', desk: 'Desk 4', eta: '30m', tone: 'rose',    status: 'Reserved' },
];

const DOTS = {
  sky:     'bg-sky-500',
  violet:  'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
};

const STATUS_TONES = {
  Ready:    'bg-sky-50 text-sky-700 ring-sky-100',
  'On deck':'bg-violet-50 text-violet-700 ring-violet-100',
  Queued:   'bg-slate-50 text-slate-600 ring-slate-200',
  Reserved: 'bg-rose-50 text-rose-700 ring-rose-100',
};

export default function NextInLineTimeline({ items = ITEMS }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Upcoming queue sequence</h3>
          <p className="text-xs text-slate-500">Predicted hand-offs across counters</p>
        </div>
        <button className="text-xs font-semibold text-sky-600 hover:text-sky-700">
          Manage →
        </button>
      </div>

      <ul className="mt-4 space-y-3.5">
        {items.map((it, i) => (
          <motion.li
            key={it.ticket}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i + 0.1, duration: 0.3 }}
            className="group flex gap-4"
          >
            {/* ETA column */}
            <div className="w-16 shrink-0 pt-1 text-right">
              <p className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Clock className="h-3 w-3" /> {it.eta}
              </p>
            </div>

            {/* Timeline column */}
            <div className="relative flex-1 pl-4">
              <span className={`absolute -left-[3px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-white ${DOTS[it.tone] || DOTS.sky}`} />
              {i < items.length - 1 && (
                <span className="absolute left-0 top-5 h-full w-px bg-slate-100" />
              )}

              <div className="rounded-2xl px-3 py-2 transition-colors group-hover:bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold tracking-tight text-slate-900">
                      Ticket #{it.ticket}
                    </p>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <p className="text-xs font-medium text-slate-600">{it.desk}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_TONES[it.status] || STATUS_TONES.Queued}`}>
                    {it.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">Estimated wait · {it.eta}</p>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
