// ============================================================================
//  FlowOps Core Engine
// ----------------------------------------------------------------------------
//  A pure, framework-agnostic simulation engine that models the operational
//  behaviour of a queue-managed business in real time. No React, no DOM, no
//  hidden globals. Every piece of state is derived from the events that flow
//  through the single reducer pipeline:
//
//      EVENT  ─►  reducer()  ─►  next state  ─►  selectors  ─►  UI
//
//  Realism model
//  -------------
//   • 1 real second  ===  1 simulated minute  (TIME.TICK_MS)
//   • Random events fire every 3–7 real seconds (EVENT_DELAY_MS_MIN/MAX)
//   • Event weights shift based on queue depth so behaviour stays believable
//   • Service time wobbles per-customer to model human variability
//   • Skip events are rare; idle periods are common
//
//  Consumers
//  ---------
//  Components NEVER import this module directly for state. They go through
//  the FlowOpsProvider so every panel shares ONE simulation. Components that
//  only need pure helpers (selectors) may import them from here.
// ============================================================================

// ---------------------------------------------------------------------------
//  Time model
// ---------------------------------------------------------------------------

export const TIME = Object.freeze({
  /** Real ms per simulated minute. 1s = 1m gives a watchable cadence. */
  TICK_MS: 1000,
  /** Minimum delay between scheduled engine events. */
  EVENT_DELAY_MS_MIN: 3000,
  /** Maximum delay between scheduled engine events. */
  EVENT_DELAY_MS_MAX: 7000,
  /** Wait after mount before the first random event fires. */
  INITIAL_DELAY_MS: 1200,
});

// ---------------------------------------------------------------------------
//  Event taxonomy
// ---------------------------------------------------------------------------

export const EVENT_TYPES = Object.freeze({
  TICK:           'TICK',            // sim-clock advance
  NEW_CUSTOMER:   'NEW_CUSTOMER',    // arrival
  SERVE_CUSTOMER: 'SERVE_CUSTOMER',  // head completed
  SKIP_CUSTOMER:  'SKIP_CUSTOMER',   // head re-queued to tail
  IDLE_PERIOD:    'IDLE_PERIOD',     // no-op heartbeat
  RESET:          'RESET',           // engine cold boot
});

// ---------------------------------------------------------------------------
//  Sample data pools
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'Aarav', 'Maya', 'Leo', 'Sana', 'Noah', 'Zara', 'Ethan', 'Aria',
  'Liam', 'Mei', 'Omar', 'Iris', 'Theo', 'Nia', 'Kai', 'Luna',
  'Diego', 'Yuki', 'Jonas', 'Priya', 'Hugo', 'Anya', 'Felix', 'Rhea',
];

const SERVICES = [
  'Consultation', 'Check-in', 'Triage', 'Billing',
  'Account Opening', 'Support', 'Renewal', 'KYC',
];

// ---------------------------------------------------------------------------
//  RNG helpers — isolated so they're easy to seed/mock in tests
// ---------------------------------------------------------------------------

const rand    = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Weighted random pick: items = [[value, weight], ...] */
const weighted = (items) => {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of items) {
    if ((r -= w) <= 0) return v;
  }
  return items[items.length - 1][0];
};

// Ticket ids increment monotonically across a session.
let _ticketCounter = 100;
const nextTicketId = () => {
  _ticketCounter += 1;
  return `A-${String(_ticketCounter).padStart(3, '0')}`;
};

// ---------------------------------------------------------------------------
//  State shape
// ---------------------------------------------------------------------------

/**
 * @returns {EngineState} A fresh, cold-boot snapshot.
 */
export function createInitialState() {
  return {
    // Simulated clock — integer minutes since boot.
    simTime: 0,

    // Active queue. Each item = { id, name, service, joinedAt, status }
    queue: [],

    // Last 6 served customers for "recently served" panels.
    recent: [],

    // Operational state of the counter itself.
    business: {
      currentServing: null,
      totalServed: 0,
      averageServiceTime: 6, // sim minutes, drifts via EMA
      isOpen: true,
    },

    // Aggregated analytics, recomputed on every event.
    analytics: {
      totalArrivals: 0,
      totalServed: 0,
      completedWaitSum: 0,
      peakHour: '—',
      arrivalsByHour: new Array(24).fill(0),
    },

    // Rolling 12-point series for the queue-length sparkline.
    history: new Array(12).fill(0),

    // Last event metadata — drives live activity feeds.
    lastEvent: { type: 'BOOT', at: 0, ref: null },

    // System health summary, derived but cached here for cheap reads.
    systemStatus: 'idle', // 'idle' | 'steady' | 'active' | 'busy' | 'closed'
  };
}

// ---------------------------------------------------------------------------
//  Derived metric helpers — cheap, pure, used inside the reducer
// ---------------------------------------------------------------------------

function recomputePeakHour(arrivalsByHour) {
  let peakIdx = 0;
  for (let i = 1; i < 24; i++) {
    if (arrivalsByHour[i] > arrivalsByHour[peakIdx]) peakIdx = i;
  }
  return arrivalsByHour[peakIdx] === 0
    ? '—'
    : `${String(peakIdx).padStart(2, '0')}:00`;
}

function recomputeSystemStatus(state) {
  if (!state.business.isOpen) return 'closed';
  const len = state.queue.length;
  if (len === 0) return 'idle';
  if (len >= 8)  return 'busy';
  if (len >= 4)  return 'active';
  return 'steady';
}

/**
 * Wrap any reducer branch so that derived analytics stay coherent without
 * forcing every branch to remember to recompute them.
 */
function withDerived(state) {
  return {
    ...state,
    analytics: {
      ...state.analytics,
      peakHour: recomputePeakHour(state.analytics.arrivalsByHour),
    },
    systemStatus: recomputeSystemStatus(state),
  };
}

// ---------------------------------------------------------------------------
//  Reducer — the SINGLE entry point for every state mutation
// ---------------------------------------------------------------------------

export function reducer(state, event) {
  switch (event.type) {
    // ----- Clock tick: 1 real second -----
    case EVENT_TYPES.TICK: {
      const simTime = state.simTime + 1;
      const history = [...state.history.slice(1), state.queue.length];
      return withDerived({ ...state, simTime, history });
    }

    // ----- Arrival -----
    case EVENT_TYPES.NEW_CUSTOMER: {
      const customer = {
        id: nextTicketId(),
        name: pick(FIRST_NAMES),
        service: pick(SERVICES),
        joinedAt: state.simTime,
        status: 'waiting',
      };
      const hour = Math.floor(state.simTime / 60) % 24;
      const arrivalsByHour = [...state.analytics.arrivalsByHour];
      arrivalsByHour[hour] += 1;

      return withDerived({
        ...state,
        queue: [...state.queue, customer],
        analytics: {
          ...state.analytics,
          totalArrivals: state.analytics.totalArrivals + 1,
          arrivalsByHour,
        },
        lastEvent: { type: EVENT_TYPES.NEW_CUSTOMER, at: state.simTime, ref: customer.id, name: customer.name },
      });
    }

    // ----- Service completion -----
    case EVENT_TYPES.SERVE_CUSTOMER: {
      if (state.queue.length === 0) return state;
      const [head, ...rest] = state.queue;
      const waitedFor = state.simTime - head.joinedAt;

      // RULE 2 — Human service variability: per-event wobble, EMA-smoothed.
      const sample = Math.max(2, Math.round(state.business.averageServiceTime + rand(-2, 3)));
      const newAvg = Number((state.business.averageServiceTime * 0.8 + sample * 0.2).toFixed(2));

      const completed = { ...head, status: 'completed', waitedFor };
      const recent = [completed, ...state.recent].slice(0, 6);

      return withDerived({
        ...state,
        queue: rest,
        recent,
        business: {
          ...state.business,
          currentServing: completed,
          totalServed: state.business.totalServed + 1,
          averageServiceTime: newAvg,
        },
        analytics: {
          ...state.analytics,
          totalServed: state.analytics.totalServed + 1,
          completedWaitSum: state.analytics.completedWaitSum + waitedFor,
        },
        lastEvent: { type: EVENT_TYPES.SERVE_CUSTOMER, at: state.simTime, ref: completed.id, name: completed.name },
      });
    }

    // ----- Skip: head moves to tail, joinedAt resets so wait restarts -----
    case EVENT_TYPES.SKIP_CUSTOMER: {
      if (state.queue.length < 2) return state;
      const [head, ...rest] = state.queue;
      const requeued = { ...head, joinedAt: state.simTime, skipped: true };
      return withDerived({
        ...state,
        queue: [...rest, requeued],
        lastEvent: { type: EVENT_TYPES.SKIP_CUSTOMER, at: state.simTime, ref: head.id, name: head.name },
      });
    }

    // ----- Idle heartbeat: nothing happens, but we still log it -----
    case EVENT_TYPES.IDLE_PERIOD:
      return {
        ...state,
        lastEvent: { type: EVENT_TYPES.IDLE_PERIOD, at: state.simTime, ref: null },
      };

    // ----- Cold reset -----
    case EVENT_TYPES.RESET:
      return createInitialState();

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
//  Event scheduler — RULE 1 + RULE 3: random, non-deterministic, queue-aware
// ---------------------------------------------------------------------------

/**
 * Pick the next event for the given state. Weights shift dynamically so the
 * system stays believable across both empty and overloaded conditions.
 *
 *   - empty queue  →  almost always arrivals
 *   - short queue  →  mostly arrivals, occasional serves
 *   - long queue   →  mostly serves, fewer arrivals, almost no idle
 */
export function pickEvent(state) {
  const qLen = state.queue.length;

  let wNew = 5, wServe = 4, wSkip = 0.4, wIdle = 1.2;

  if (qLen === 0) {
    wNew = 8;   wServe = 0; wSkip = 0;
  } else if (qLen <= 2) {
    wNew = 6;   wServe = 2.5;
  } else if (qLen >= 8) {
    wNew = 2;   wServe = 7; wIdle = 0.4;
  } else if (qLen >= 5) {
    wNew = 3.5; wServe = 5;
  }

  return weighted([
    [EVENT_TYPES.NEW_CUSTOMER,   wNew],
    [EVENT_TYPES.SERVE_CUSTOMER, wServe],
    [EVENT_TYPES.SKIP_CUSTOMER,  wSkip],
    [EVENT_TYPES.IDLE_PERIOD,    wIdle],
  ]);
}

/** Real-world milliseconds between events. */
export function nextEventDelay() {
  return randInt(TIME.EVENT_DELAY_MS_MIN, TIME.EVENT_DELAY_MS_MAX);
}

// ---------------------------------------------------------------------------
//  Public selectors — UI must read derived metrics through these only
// ---------------------------------------------------------------------------

export const selectQueueLength    = (s) => s.queue.length;
export const selectTotalServed    = (s) => s.analytics.totalServed;
export const selectTotalArrivals  = (s) => s.analytics.totalArrivals;

export const selectEstimatedWait = (s) =>
  Math.round(s.queue.length * s.business.averageServiceTime);

export const selectEfficiency = (s) => {
  const { totalArrivals, totalServed } = s.analytics;
  if (totalArrivals === 0) return 0;
  return Math.min(100, Math.round((totalServed / totalArrivals) * 100));
};

export const selectAverageWait = (s) => {
  if (s.analytics.totalServed === 0) return 0;
  return Number((s.analytics.completedWaitSum / s.analytics.totalServed).toFixed(1));
};

export const selectStatus = (s) => {
  const map = {
    closed: { label: 'Closed', tone: 'idle'   },
    idle:   { label: 'Idle',   tone: 'idle'   },
    steady: { label: 'Steady', tone: 'steady' },
    active: { label: 'Active', tone: 'active' },
    busy:   { label: 'Busy',   tone: 'busy'   },
  };
  return map[s.systemStatus] ?? map.idle;
};
