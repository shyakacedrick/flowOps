import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEventLog } from '../../../hooks/useEventLog.js';

/**
 * LiveActivityFeed — true live event stream backed by the FlowOps engine.
 *
 * Engine `lastEvent` → useEventLog → animated insertions at the top, with
 * smooth slide / fade for older rows. Caps at 15 entries. A 1s tick keeps
 * the "Xs ago" copy fresh without re-rendering the engine.
 */
const AVATARS = {
  sky:     'from-sky-400 to-blue-500',
  violet:  'from-violet-400 to-fuchsia-500',
  amber:   'from-amber-400 to-orange-500',
  rose:    'from-rose-400 to-pink-500',
  emerald: 'from-emerald-400 to-teal-500',
};
const TAGS = {
  sky:     'bg-sky-500/10 text-sky-300 ring-sky-400/20',
  violet:  'bg-violet-500/10 text-violet-300 ring-violet-400/20',
  amber:   'bg-amber-500/10 text-amber-300 ring-amber-400/20',
  rose:    'bg-rose-500/10 text-rose-300 ring-rose-400/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
};

const SEED_ROWS = [
  { id: -1, label: 'John Doe checked in via QR code',   sub: 'Ticket A-099', name: 'John Doe',     tag: 'Clinic Queue',  tagTone: 'sky',    avatarTone: 'sky',    ts: Date.now() - 60_000 },
  { id: -2, label: 'Sarah Jenkins called to Counter 2', sub: 'Ticket A-098', name: 'Sarah Jenkins',tag: 'Counter Alert', tagTone: 'violet', avatarTone: 'violet', ts: Date.now() - 90_000 },
  { id: -3, label: 'David Smith marked as no-show',     sub: 'Ticket A-097', name: 'David Smith',  tag: 'System Auto',   tagTone: 'rose',   avatarTone: 'rose',   ts: Date.now() - 180_000 },
];

export default function LiveActivityFeed() {
  const liveRows = useEventLog();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const rows = liveRows.length >= 3 ? liveRows : [...liveRows, ...SEED_ROWS].slice(0, 15);

  return (
    <section className="overflow-hidden rounded-3xl bg-white/[0.03] shadow-sm ring-1 ring-white/[0.06]">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-white/[0.06] px-5 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">Live queue activity</h3>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
              {rows.length} events
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Continuously updating customer transitions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden w-56 items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 lg:flex">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <input
              type="text"
              placeholder="Search…"
              className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <button className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ul className="max-h-[480px] divide-y divide-white/[0.05] overflow-y-auto">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.li
              key={r.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,   scale: 1 }}
              exit={{    opacity: 0, y: 12,  scale: 0.98 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03] sm:gap-4 sm:px-6"
            >
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${AVATARS[r.avatarTone] || AVATARS.sky} text-xs font-bold text-white shadow-sm`}>
                {initialsOf(r.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="truncate text-sm font-semibold text-slate-100">{r.label}</p>
                  <span className="shrink-0 text-[11px] font-medium text-slate-500">· {timeAgo(r.ts)}</span>
                </div>
                <p className="truncate text-xs text-slate-400">{r.sub}</p>
              </div>
              <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 sm:inline-flex ${TAGS[r.tagTone] || TAGS.sky}`}>
                {r.tag}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

function initialsOf(name = 'FO') {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5)   return 'just now';
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
