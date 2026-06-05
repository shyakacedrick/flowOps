// ============================================================================
//  FlowOpsProvider — compatibility shim
// ----------------------------------------------------------------------------
//  The simulation is now owned by `simulationEngine.js` and surfaced via
//  `SimulationProvider`. This module exists ONLY for backwards compatibility
//  with components written against the historic FlowOps API.
//
//  Prefer:   import { useSimulation }      from '@/engine/SimulationProvider'
//  Legacy:   import { useFlowOps }         from '@/engine/FlowOpsProvider'
// ============================================================================

import {
  SimulationProvider,
  useSimulation,
  useSimulationSlice,
  useSimulationDispatch,
  useSimulationControls,
} from '@/engine/SimulationProvider.jsx';

/** @deprecated Use `<SimulationProvider>` directly. */
export const FlowOpsProvider = SimulationProvider;

/** @deprecated Use `useSimulation()`. */
export const useFlowOps = useSimulation;

/** @deprecated Use `useSimulationDispatch()`. */
export const useFlowOpsDispatch = useSimulationDispatch;

/** @deprecated Use `useSimulationControls()`. */
export const useFlowOpsControls = useSimulationControls;

/** @deprecated Use `useSimulationSlice(selector)`. */
export const useFlowOpsSelector = useSimulationSlice;

/** @deprecated Convenience tuple. */
export function useFlowOpsTuple() {
  return [useSimulation(), useSimulationDispatch()];
}
