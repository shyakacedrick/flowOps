// Thin selector hook — insight rotation is owned by the central simulation.
// We return the insight object directly (it already carries `index` + `total`)
// so the snapshot reference stays stable between rotations.
import { useSimulationSlice } from '@/engine/SimulationProvider.jsx';

/**
 * @returns { insight: {icon,title,description,recommendation,index,total},
 *            index, total }
 */
export function useRotatingInsight() {
  const insight = useSimulationSlice((s) => s.insight);
  return { insight, index: insight.index, total: insight.total };
}
