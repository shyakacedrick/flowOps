// ============================================================================
//  useQueueEngine — semantic alias over the FlowOps engine
// ----------------------------------------------------------------------------
//  Gives feature code a queue-centric vocabulary while delegating to the
//  shared FlowOpsProvider. Pure read of state + a small dispatcher API.
// ============================================================================

import { useMemo } from 'react';
import {
  useFlowOps,
  useFlowOpsDispatch,
} from '../engine/FlowOpsProvider.jsx';
import { createEventDispatcher } from '../utils/eventGenerator.js';

export function useQueueEngine() {
  const state = useFlowOps();
  const dispatch = useFlowOpsDispatch();
  const actions = useMemo(() => createEventDispatcher(dispatch), [dispatch]);

  return {
    queue:     state.queue,
    head:      state.queue[0] ?? null,
    recent:    state.recent,
    analytics: state.analytics,
    business:  state.business,
    simTime:   state.simTime,
    lastEvent: state.lastEvent,
    actions,
  };
}
