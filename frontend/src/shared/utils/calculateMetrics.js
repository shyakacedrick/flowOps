// ============================================================================
//  calculateMetrics — thin façade over engine selectors
// ----------------------------------------------------------------------------
//  Re-exports the canonical selectors so UI code can `import from 'utils'`
//  without binding to the engine path. Also adds a few composite metrics
//  used across multiple dashboards.
// ============================================================================

import {
  selectQueueLength,
  selectTotalServed,
  selectTotalArrivals,
  selectEstimatedWait,
  selectEfficiency,
  selectAverageWait,
  selectStatus,
} from '@/engine/flowOpsEngine.js';

export {
  selectQueueLength,
  selectTotalServed,
  selectTotalArrivals,
  selectEstimatedWait,
  selectEfficiency,
  selectAverageWait,
  selectStatus,
};

/** Capacity utilisation as a 0-100% number (10 = full). */
export function calculateLoad(queueLength, capacity = 10) {
  return Math.min(100, Math.round((queueLength / capacity) * 100));
}

/** Composite flow rating combining efficiency + wait penalty. */
export function calculateFlowRating(efficiency, avgWait) {
  const waitPenalty = avgWait > 8 ? 15 : 0;
  const waitBonus   = avgWait > 0 ? 30 : 50;
  return Math.max(0, Math.min(100, Math.round(efficiency * 0.7 + waitBonus - waitPenalty)));
}

/** Maps efficiency to a semantic tone token. */
export function efficiencyTone(pct) {
  if (pct >= 80) return 'success';
  if (pct >= 60) return 'warning';
  return 'danger';
}
