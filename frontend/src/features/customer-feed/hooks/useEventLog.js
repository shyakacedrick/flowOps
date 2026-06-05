// Thin selector hook — the activity log is owned by the central simulation.
import { useSimulationSlice } from '@/engine/SimulationProvider.jsx';

/** Returns the rolling activity log (newest first, capped at 15). */
export function useEventLog() {
  return useSimulationSlice((s) => s.activityLog);
}
