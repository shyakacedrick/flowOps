// ============================================================================
//  LiveStatusBar
// ----------------------------------------------------------------------------
//  A "this dashboard is alive" status strip designed for the top of any
//  analytics surface. Three signals at a glance:
//
//    1.  Pulsing live dot — system heartbeat
//    2.  "Last updated Xs ago" — increments every real second
//    3.  Animated processing line — drifts a shimmer across the bar each time
//        the engine emits a fresh event (state.lastEvent.at changes)
//
//  Everything is read from the FlowOps engine; no internal simulation.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RadioTower, Wifi, Activity } from 'lucide-react';
import { useSimulationSlice } from '../engine/SimulationProvider.jsx';
import { formatAgo } from '../utils/formatTime.js';
import { ease } from '../animations/motion';

export default function LiveStatusBar({ title = 'Live operational data' }) {
  // Subscribe only to lastEvent — this component only needs to detect new events.
  const lastEvent = useSimulationSlice((s) => s.lastEvent);

  // Anchor wall-clock per engine event — "last updated" measures real seconds
  // since the most recent reducer activity. We watch lastEvent.at + type so
  // even idle periods count as a heartbeat moment.
  const [lastUpdate, setLastUpdate] = useState(() => Date.now());
  const [now, setNow]               = useState(() => Date.now());
  const [refreshKey, setRefreshKey] = useState(0);

  const eventSig = `${lastEvent.type}-${lastEvent.at}-${lastEvent.ref ?? ''}`;
  const seenSig  = useRef(eventSig);

  useEffect(() => {
    if (eventSig !== seenSig.current) {
      seenSig.current = eventSig;
      setLastUpdate(Date.now());
      setRefreshKey((k) => k + 1);   // re-triggers shimmer sweep
    }
  }, [eventSig]);

  // Tick a 1-second display clock so the "Xs ago" label feels alive.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 backdrop-blur-xl">
      {/* Shimmer sweep — fires once per engine event */}
      <AnimatePresence>
        <motion.div
          key={refreshKey}
          aria-hidden
          initial={{ x: '-30%', opacity: 0 }}
          animate={{ x: '120%', opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.4, ease: ease.out }}
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/15 to-transparent"
        />
      </AnimatePresence>

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Live dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>

          <p className="text-xs font-semibold text-white">
            {title}
          </p>

          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <RadioTower className="h-3 w-3" /> Live
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          {/* Animated processing text */}
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-primary" />
            <span>Processing real-time queue data</span>
            <span className="inline-flex gap-0.5">
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >.</motion.span>
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              >.</motion.span>
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              >.</motion.span>
            </span>
          </span>

          <span className="hidden h-3 w-px bg-white/10 sm:block" />

          <span className="inline-flex items-center gap-1.5">
            <Wifi className="h-3 w-3 text-slate-500" />
            <span className="font-mono tabular-nums">
              Last updated <span className="text-white">{formatAgo(lastUpdate, now)}</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
