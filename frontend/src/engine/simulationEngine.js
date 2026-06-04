// ============================================================================
//  Simulation Engine — Centralized Operational Heartbeat
// ----------------------------------------------------------------------------
//  ONE clock. ONE event pipeline. ONE state tree. Every queue event, KPI,
//  activity log entry, chart point, AI insight, and system-status change in
//  the entire FlowOps dashboard is driven from this module.
//
//      ┌─────────────────────────────────────────────────────────┐
//      │  SimulationEngine                                       │
//      │  ─ single 1s heartbeat (start/stop/reset)               │
//      │  ─ owns queue state + KPIs       (reducer pipeline)     │
//      │  ─ owns rolling activity log     (15 most recent events)│
//      │  ─ owns chart history            (12-point rolling)     │
//      │  ─ owns AI insight rotation      (20–40s cadence)       │
//      │  ─ owns subsystem health drift   (5–12s cadence)        │
//      │  ─ subscribe(listener) → unsubscribe                    │
//      │  ─ getSnapshot() → frozen state for useSyncExternalStore│
//      └─────────────────────────────────────────────────────────┘
//
//  No component, hook, or panel may instantiate or run its own simulation.
//  Everything reads via SimulationProvider's hooks.
// ============================================================================

import {
  EVENT_TYPES,
  TIME,
  createInitialState,
  nextEventDelay,
  pickEvent,
  reducer,
} from './flowOpsEngine.js';

// ---------------------------------------------------------------------------
//  Activity log — decorates engine events into UI-ready rows
// ---------------------------------------------------------------------------

const ACTIVITY_MAX = 15;
let _activityId = 0;

function decorateActivity(ev) {
  const id = ++_activityId;
  const ts = Date.now();
  switch (ev.type) {
    case EVENT_TYPES.NEW_CUSTOMER:
      return {
        id, ts, type: ev.type, ref: ev.ref, name: ev.name,
        label: `${ev.name || 'New customer'} joined the queue`,
        sub: `Ticket ${ev.ref || '—'}`,
        tag: 'Queue join', tagTone: 'sky', avatarTone: 'sky',
      };
    case EVENT_TYPES.SERVE_CUSTOMER:
      return {
        id, ts, type: ev.type, ref: ev.ref, name: ev.name,
        label: `${ev.name || 'Customer'} served at counter`,
        sub: `Ticket ${ev.ref || '—'} · completed`,
        tag: 'Resolved', tagTone: 'emerald', avatarTone: 'emerald',
      };
    case EVENT_TYPES.SKIP_CUSTOMER:
      return {
        id, ts, type: ev.type, ref: ev.ref, name: ev.name,
        label: `${ev.name || 'Customer'} marked as no-show`,
        sub: `Ticket ${ev.ref || '—'} · re-queued`,
        tag: 'System auto', tagTone: 'rose', avatarTone: 'rose',
      };
    case EVENT_TYPES.IDLE_PERIOD:
      return {
        id, ts, type: ev.type, ref: null, name: 'System',
        label: 'Quiet period · no arrivals',
        sub: 'Operations stable',
        tag: 'Heartbeat', tagTone: 'amber', avatarTone: 'amber',
      };
    case EVENT_TYPES.RESET:
      return {
        id, ts, type: ev.type, ref: null, name: 'System',
        label: 'Operational state reset',
        sub: 'Clean slate · all counters open',
        tag: 'System', tagTone: 'violet', avatarTone: 'violet',
      };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
//  AI insight rotation pool
// ---------------------------------------------------------------------------

const INSIGHTS = Object.freeze([
  { icon: '💡', title: 'Peak hours detected',
    description: 'Customer traffic is highest between 2PM – 5PM.',
    recommendation: 'Allocate one additional staff member to Counter 3 during peak periods.' },
  { icon: '⚡', title: 'Queue efficiency improved by 8%',
    description: 'Service throughput is trending upward in the last hour.',
    recommendation: 'Maintain current staffing — performance is above target.' },
  { icon: '🚀', title: 'Counter 2 is processing customers fastest',
    description: 'Average service time at Counter 2 is 18% below baseline.',
    recommendation: 'Consider routing complex tickets to Counter 2 during peak load.' },
  { icon: '🎯', title: 'Average wait time dropped below target',
    description: 'Wait times are now under 14 minutes — within SLA.',
    recommendation: 'Reinforce current staffing pattern through the afternoon.' },
  { icon: '📈', title: 'Customer flow has increased by 14%',
    description: 'Hourly arrivals are up versus last week\u2019s baseline.',
    recommendation: 'Prepare a contingency counter to absorb extra volume.' },
  { icon: '🔔', title: 'Peak traffic expected within 30 minutes',
    description: 'Historical pattern suggests an inbound surge.',
    recommendation: 'Notify break-room staff to be ready for redeployment.' },
]);

const INSIGHT_MIN_MS = 20_000;
const INSIGHT_MAX_MS = 40_000;

// ---------------------------------------------------------------------------
//  Subsystem health drift
// ---------------------------------------------------------------------------

const SUBSYSTEM_DEFS = Object.freeze([
  { key: 'queue',         label: 'Queue Engine'        },
  { key: 'analytics',     label: 'Analytics Engine'    },
  { key: 'insights',      label: 'Insight Engine'      },
  { key: 'notifications', label: 'Notification Engine' },
]);

const DRIFT_MIN_MS = 5_000;
const DRIFT_MAX_MS = 12_000;

function initSubsystems() {
  return SUBSYSTEM_DEFS.map((s) => ({
    ...s,
    status: 'online',
    latency: 30 + Math.round(Math.random() * 40),
    since: Date.now(),
  }));
}

function driftSubsystems(prev) {
  // Drift exactly ONE subsystem on each drift tick so changes feel realistic.
  const idx = Math.floor(Math.random() * prev.length);
  return prev.map((s, i) => {
    if (i !== idx) return s;
    const roll = Math.random();
    let next = s.status;
    if (s.status === 'online') {
      if (roll < 0.18) next = 'degraded';
      else if (roll < 0.20) next = 'offline';
    } else if (s.status === 'degraded') {
      if (roll < 0.55) next = 'online';
      else if (roll < 0.62) next = 'offline';
    } else if (s.status === 'offline') {
      if (roll < 0.7) next = 'degraded';
    }
    const latency =
      next === 'online'   ? 30 + Math.round(Math.random() * 30) :
      next === 'degraded' ? 120 + Math.round(Math.random() * 220) :
      0;
    return {
      ...s,
      status: next,
      latency,
      since: next !== s.status ? Date.now() : s.since,
    };
  });
}

// ---------------------------------------------------------------------------
//  Utility
// ---------------------------------------------------------------------------

const randMs = (min, max) => min + Math.random() * (max - min);

// ===========================================================================
//  SimulationEngine — class-based store, framework-agnostic
// ===========================================================================

export class SimulationEngine {
  constructor() {
    this._listeners = new Set();
    this._timer = null;
    this._lastTickAt = 0;

    // Next-fire timestamps for each cadence-driven subsystem.
    this._nextEventAt    = 0;
    this._nextInsightAt  = 0;
    this._nextDriftAt    = 0;

    this._snapshot = this._buildInitialSnapshot();
  }

  // -------------------------------------------------------------------------
  //  Snapshot construction — every change produces a NEW object reference so
  //  React's useSyncExternalStore detects the update.
  // -------------------------------------------------------------------------

  _buildInitialSnapshot() {
    const core = createInitialState();
    return Object.freeze({
      ...core,
      activityLog: [],
      insight: { ...INSIGHTS[0], index: 0, total: INSIGHTS.length },
      subsystems: initSubsystems(),
      lastUpdatedAt: Date.now(),
      running: false,
    });
  }

  _merge(patch) {
    this._snapshot = Object.freeze({ ...this._snapshot, ...patch });
    this._notify();
  }

  _notify() {
    this._listeners.forEach((fn) => fn());
  }

  // -------------------------------------------------------------------------
  //  Public store API
  // -------------------------------------------------------------------------

  subscribe = (listener) => {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  };

  getSnapshot = () => this._snapshot;

  /**
   * Dispatch a queue/business event directly (e.g. button-driven actions
   * like "Call next customer" or "Add customer to queue"). Goes through the
   * same reducer pipeline as scheduled events and is logged to activity.
   */
  dispatch = (action) => {
    const prevCore = this._coreSlice(this._snapshot);
    const nextCore = reducer(prevCore, action);
    if (nextCore === prevCore) return;
    this._applyCoreUpdate(nextCore);
  };

  /** Apply a core-engine state delta + the activity log entry it generates. */
  _applyCoreUpdate(nextCore) {
    const activity = decorateActivity(nextCore.lastEvent);
    const log = activity
      ? [activity, ...this._snapshot.activityLog].slice(0, ACTIVITY_MAX)
      : this._snapshot.activityLog;
    this._merge({
      ...nextCore,
      activityLog: log,
      lastUpdatedAt: Date.now(),
    });
  }

  /** Extract only the keys the reducer cares about, for clean updates. */
  _coreSlice(snap) {
    const {
      simTime, queue, recent, business, analytics,
      history, lastEvent, systemStatus,
    } = snap;
    return { simTime, queue, recent, business, analytics, history, lastEvent, systemStatus };
  }

  // -------------------------------------------------------------------------
  //  Control surface
  // -------------------------------------------------------------------------

  start() {
    if (this._timer) return;
    const now = Date.now();
    this._lastTickAt   = now;
    this._nextEventAt  = now + TIME.INITIAL_DELAY_MS;
    this._nextInsightAt = now + randMs(INSIGHT_MIN_MS, INSIGHT_MAX_MS);
    this._nextDriftAt   = now + randMs(DRIFT_MIN_MS, DRIFT_MAX_MS);
    this._merge({ running: true });
    this._timer = setInterval(this._tick, TIME.TICK_MS);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._merge({ running: false });
  }

  toggle() {
    if (this._timer) this.stop();
    else this.start();
  }

  reset() {
    const wasRunning = !!this._timer;
    this.stop();
    this._snapshot = this._buildInitialSnapshot();
    this._notify();
    if (wasRunning) this.start();
  }

  // -------------------------------------------------------------------------
  //  Central tick — runs every TIME.TICK_MS. Drives EVERY subsystem.
  // -------------------------------------------------------------------------

  _tick = () => {
    const now = Date.now();
    this._lastTickAt = now;

    // 1) Sim-clock advance + history roll (always).
    let core = this._coreSlice(this._snapshot);
    core = reducer(core, { type: EVENT_TYPES.TICK });
    // Apply core tick WITHOUT logging activity (TICK isn't an interesting event).
    let nextPatch = { ...core };

    // 2) Scheduled engine event (queue arrival/serve/skip/idle).
    if (now >= this._nextEventAt) {
      const evType = pickEvent(core);
      const nextCore = reducer(core, { type: evType });
      const activity = decorateActivity(nextCore.lastEvent);
      core = nextCore;
      nextPatch = {
        ...nextPatch,
        ...core,
        activityLog: activity
          ? [activity, ...this._snapshot.activityLog].slice(0, ACTIVITY_MAX)
          : this._snapshot.activityLog,
        lastUpdatedAt: now,
      };
      this._nextEventAt = now + nextEventDelay();
    }

    // 3) AI insight rotation.
    if (now >= this._nextInsightAt) {
      const nextIdx = (this._snapshot.insight.index + 1) % INSIGHTS.length;
      nextPatch.insight = { ...INSIGHTS[nextIdx], index: nextIdx, total: INSIGHTS.length };
      this._nextInsightAt = now + randMs(INSIGHT_MIN_MS, INSIGHT_MAX_MS);
    }

    // 4) Subsystem health drift.
    if (now >= this._nextDriftAt) {
      nextPatch.subsystems = driftSubsystems(this._snapshot.subsystems);
      this._nextDriftAt = now + randMs(DRIFT_MIN_MS, DRIFT_MAX_MS);
    }

    this._merge(nextPatch);
  };
}

// ---------------------------------------------------------------------------
//  Singleton — there is exactly ONE simulation per browser tab.
// ---------------------------------------------------------------------------

export const simulation = new SimulationEngine();

// Re-export event constants so callers have a single import surface.
export { EVENT_TYPES, TIME };
