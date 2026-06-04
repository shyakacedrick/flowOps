// ============================================================================
//  LiveActivityFeed
// ----------------------------------------------------------------------------
//  A real-time system monitor panel that observes the FlowOps engine and
//  surfaces a continuously updating stream of events. Each TICK / arrival /
//  service / skip flowing through the engine becomes a feed item. Synthetic
//  "system" events (peak detection, insight generated) are added on top.
//
//  Architectural notes
//  -------------------
//   • Reads from the shared engine via useFlowOps() — no private timers
//   • Pure presentation: NEVER mutates engine state
//   • Caps the visible buffer (defaults to 6) so the DOM stays light
//   • Re-keys timestamps every 5s via a tick state so "2s ago" stays fresh
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  UserPlus,
  CheckCircle2,
  SkipForward,
  Flame,
  Sparkles,
  Radio,
  Minimize2,
  Maximize2,
  Inbox,
} from 'lucide-react';
import { useFlowOps } from '../engine/FlowOpsProvider.jsx';
import { EVENT_TYPES } from '../engine/flowOpsEngine.js';
import { ease } from '../animations/motion';
import EmptyState from './EmptyState.jsx';

// ---------------------------------------------------------------------------
//  Event-type registry — icon, color, copy
// ---------------------------------------------------------------------------

const REGISTRY = {
  NEW_CUSTOMER: {
    icon: UserPlus,
    tone: 'blue',
    label: (e) => `${e.name ?? 'New customer'} joined the queue`,
    sub:   (e) => `Ticket ${e.ref ?? '—'} · queue updated`,
  },
  SERVE_CUSTOMER: {
    icon: CheckCircle2,
    tone: 'green',
    label: (e) => `${e.name ? `${e.name} — served successfully` : `Customer ${e.ref ?? ''} served`}`,
    sub:   (e) => `Ticket ${e.ref ?? '—'} · transaction closed`,
  },
  SKIP_CUSTOMER: {
    icon: SkipForward,
    tone: 'amber',
    label: (e) => `${e.name ? `${e.name} skipped` : `Customer ${e.ref ?? ''} skipped`}`,
    sub:   (e) => `Ticket ${e.ref ?? '—'} · re-queued to tail`,
  },
  PEAK_DETECTED: {
    icon: Flame,
    tone: 'amber',
    label: (e) => `Peak traffic detected · ${e.ref ?? ''}`,
    sub:   () => 'Recommend opening auxiliary counter',
  },
  INSIGHT_GENERATED: {
    icon: Sparkles,
    tone: 'violet',
    label: () => 'New insight generated',
    sub:   () => 'Smart Insights engine',
  },
  QUEUE_RESET: {
    icon: Activity,
    tone: 'blue',
    label: () => 'Queue reset',
    sub:   () => 'Operational state cleared',
  },
  QUEUE_UPDATED: {
    icon: Activity,
    tone: 'blue',
    label: (e) => `Queue rebalanced · ${e.ref} in line`,
    sub:   () => 'Live system check',
  },
};

const TONE_STYLES = {
  blue:   { dot: 'bg-primary',      icon: 'text-primary border-primary/30 bg-primary/10' },
  green:  { dot: 'bg-emerald-400',  icon: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' },
  amber:  { dot: 'bg-amber-400',    icon: 'text-amber-300 border-amber-400/30 bg-amber-400/10' },
  violet: { dot: 'bg-violet-400',   icon: 'text-violet-300 border-violet-400/30 bg-violet-400/10' },
};

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function formatAgo(ms, now) {
  const delta = Math.max(0, Math.floor((now - ms) / 1000));
  if (delta < 2)  return 'just now';
  if (delta < 60) return `${delta}s ago`;
  const m = Math.floor(delta / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

let _entryId = 0;
const nextId = () => ++_entryId;

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

export default function LiveActivityFeed({
  limit = 6,
  className = '',
}) {
  const state = useFlowOps();
  const [entries, setEntries] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const [collapsed, setCollapsed] = useState(false);

  // Refresh "Xs ago" labels every 1s so the feed reads as truly live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // -----------------------------------------------------------------------
  //  Engine event → feed entry
  //  We watch state.lastEvent for changes. Each new (type + at) tuple is one
  //  feed item. Synthetic insights are layered on by separate effects below.
  // -----------------------------------------------------------------------
  const lastSeenKey = useRef('BOOT-0');

  useEffect(() => {
    const { type, at, ref, name } = state.lastEvent;
    const key = `${type}-${at}-${ref ?? ''}`;
    if (key === lastSeenKey.current) return;
    lastSeenKey.current = key;
    if (!REGISTRY[type]) return; // skip BOOT / IDLE / RESET / TICK

    setEntries((prev) => {
      const entry = {
        id: nextId(),
        type,
        ref,
        name,
        at: Date.now(),
      };
      return [entry, ...prev].slice(0, limit);
    });
  }, [state.lastEvent, limit]);

  // -----------------------------------------------------------------------
  //  Synthetic "system" event: peak detected
  //  Fires once whenever peakHour changes to a real value.
  // -----------------------------------------------------------------------
  const lastPeakRef = useRef(state.analytics.peakHour);
  useEffect(() => {
    const peak = state.analytics.peakHour;
    if (peak !== '—' && peak !== lastPeakRef.current) {
      lastPeakRef.current = peak;
      setEntries((prev) => [
        { id: nextId(), type: 'PEAK_DETECTED', ref: peak, at: Date.now() },
        ...prev,
      ].slice(0, limit));
    }
  }, [state.analytics.peakHour, limit]);

  // -----------------------------------------------------------------------
  //  Synthetic "system" event: insight generated
  //  Fires every ~12 served customers — same cadence used by the analytics UI.
  // -----------------------------------------------------------------------
  const lastInsightServed = useRef(0);
  useEffect(() => {
    const served = state.analytics.totalServed;
    if (served > 0 && served % 12 === 0 && served !== lastInsightServed.current) {
      lastInsightServed.current = served;
      setEntries((prev) => [
        { id: nextId(), type: 'INSIGHT_GENERATED', ref: null, at: Date.now() },
        ...prev,
      ].slice(0, limit));
    }
  }, [state.analytics.totalServed, limit]);

  // -----------------------------------------------------------------------
  //  Synthetic "system" event: queue reset
  //  Detected when simTime collapses back to 0 from a positive value.
  // -----------------------------------------------------------------------
  const lastSimTime = useRef(state.simTime);
  useEffect(() => {
    if (lastSimTime.current > 0 && state.simTime === 0) {
      setEntries((prev) => [
        { id: nextId(), type: 'QUEUE_RESET', ref: null, at: Date.now() },
        ...prev,
      ].slice(0, limit));
    }
    lastSimTime.current = state.simTime;
  }, [state.simTime, limit]);

  const hasActivity = entries.length > 0;

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative grid h-7 w-7 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <Radio className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Live activity</p>
              <p className="truncate text-[10px] uppercase tracking-widest text-slate-500">
                System monitor · streaming
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand activity feed' : 'Collapse activity feed'}
            className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            {collapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Stream */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: ease.out }}
              className="overflow-hidden"
            >
              <ul className="space-y-1.5 px-3 py-3">
                {!hasActivity && (
                  <li>
                    <EmptyState
                      icon={Inbox}
                      title="Listening for activity"
                      message="System events will stream here the moment they happen."
                      size="sm"
                      tone="info"
                    />
                  </li>
                )}
                <AnimatePresence initial={false}>
                  {entries.map((e) => {
                    const reg = REGISTRY[e.type];
                    if (!reg) return null;
                    const Icon = reg.icon;
                    const tone = TONE_STYLES[reg.tone];
                    // Older entries (>30s old) fade slightly to convey recency.
                    const age = (now - e.at) / 1000;
                    const opacity = age > 30 ? 0.6 : age > 12 ? 0.85 : 1;
                    return (
                      <motion.li
                        key={e.id}
                        layout
                        initial={{ opacity: 0, x: 14, scale: 0.97 }}
                        animate={{ opacity, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -14, scale: 0.97 }}
                        transition={{ duration: 0.3, ease: ease.out }}
                        className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                      >
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border ${tone.icon}`}>
                          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-white">
                            {reg.label(e)}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {reg.sub(e)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                          <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                            {formatAgo(e.at, now)}
                          </span>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>

              <div className="border-t border-white/[0.05] px-4 py-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  {entries.length} event{entries.length === 1 ? '' : 's'} · last {limit} kept
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Floating dock variant — fixed to the bottom-right of the viewport,
 * mounted once at the app/page root. Hidden on mobile to avoid covering
 * primary content; replaced by an inline version where needed.
 */
export function LiveActivityFeedDock() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-end px-4 md:bottom-6 md:px-6">
      <div className="pointer-events-auto hidden w-[340px] max-w-full md:block">
        <LiveActivityFeed limit={5} />
      </div>
    </div>
  );
}
