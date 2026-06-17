// ============================================================================
//  useRotatingInsight — placeholder until a backend insights service ships
// ----------------------------------------------------------------------------
//  Previously hooked into the simulation engine to rotate through a
//  hardcoded library of fake AI insights. Returns `null` now so the
//  consuming panel renders a "no insights yet" empty state instead of
//  synthetic recommendations.
// ============================================================================

export function useRotatingInsight() {
  return { insight: null, index: 0, total: 0 };
}

export default useRotatingInsight;
