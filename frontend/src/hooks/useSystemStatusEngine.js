// Thin selector hook — subsystem health drift is owned by the central simulation.
import { useSimulationSlice } from '../engine/SimulationProvider.jsx';

export function useSystemStatusEngine() {
  return useSimulationSlice((s) => s.subsystems);
}
