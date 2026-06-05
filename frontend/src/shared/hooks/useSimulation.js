// ============================================================================
//  useSimulation — control surface for the live engine
// ----------------------------------------------------------------------------
//  Thin alias over useFlowOpsControls. Exposed under this name to match the
//  documented public hook surface.
// ============================================================================

import { useFlowOpsControls } from '@/engine/FlowOpsProvider.jsx';

export function useSimulation() {
  const { running, pause, resume, toggle, reset } = useFlowOpsControls();
  return {
    running,
    paused: !running,
    pause,
    resume,
    toggle,
    reset,
  };
}
