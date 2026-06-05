// ============================================================================
//  useSystemPhase
// ----------------------------------------------------------------------------
//  Drives the FlowOps product-story flow. Returns the current narrative
//  phase the system is in, derived purely from live engine signals:
//
//    initializing → activating → active → mature
//
//  Phase semantics
//  ---------------
//    initializing — engine just booted, no activity yet
//    activating   — first customers arriving, system warming up
//    active       — sustained queue + service flow
//    mature       — enough cumulative service to evidence stable operations
//
//  These phases gate the staged reveals across dashboards (banners, KPI
//  fade-ins, insight unlocks). Pure read — never mutates engine state.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFlowOps } from '@/engine/FlowOpsProvider.jsx';

export const PHASES = {
  INITIALIZING: 'initializing',
  ACTIVATING:   'activating',
  ACTIVE:       'active',
  MATURE:       'mature',
};

const PHASE_META = {
  initializing: {
    label:    'System initializing',
    narrative:'Bringing the operational layer online. Awaiting first signal.',
    tone:     'idle',
  },
  activating: {
    label:    'System activating',
    narrative:'First customers detected. Queue and service stream warming up.',
    tone:     'info',
  },
  active: {
    label:    'System active',
    narrative:'Live customer flow in motion. Real-time metrics updating.',
    tone:     'live',
  },
  mature: {
    label:    'Running smoothly',
    narrative:'Stable throughput, sustained intelligence. Operations matured.',
    tone:     'success',
  },
};

function derivePhase({ simTime, totalArrivals, totalServed }) {
  if (totalArrivals === 0 && simTime < 4)  return PHASES.INITIALIZING;
  if (totalArrivals === 0)                 return PHASES.INITIALIZING;
  if (totalServed >= 8)                    return PHASES.MATURE;
  if (totalArrivals >= 1)                  return totalServed >= 1 ? PHASES.ACTIVE : PHASES.ACTIVATING;
  return PHASES.ACTIVATING;
}

export function useSystemPhase() {
  const state = useFlowOps();
  const phase = derivePhase({
    simTime:        state.simTime,
    totalArrivals:  state.analytics.totalArrivals,
    totalServed:    state.analytics.totalServed,
  });

  // Track when each phase was first reached — drives staged reveals.
  const [enteredAt, setEnteredAt] = useState(() => ({ [phase]: Date.now() }));
  const last = useRef(phase);
  useEffect(() => {
    if (phase !== last.current) {
      last.current = phase;
      setEnteredAt((prev) => (prev[phase] ? prev : { ...prev, [phase]: Date.now() }));
    }
  }, [phase]);

  return useMemo(() => ({
    phase,
    meta: PHASE_META[phase],
    enteredAt,
    /** Has the system reached at least `target` phase? */
    hasReached(target) {
      const order = [PHASES.INITIALIZING, PHASES.ACTIVATING, PHASES.ACTIVE, PHASES.MATURE];
      return order.indexOf(phase) >= order.indexOf(target);
    },
  }), [phase, enteredAt]);
}
