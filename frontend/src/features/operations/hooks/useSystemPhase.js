// ============================================================================
//  useSystemPhase — narrative phase for staged dashboard reveals
// ----------------------------------------------------------------------------
//  Previously derived from the simulation engine. Now derives from the real
//  org's lifetime ticket counts via the analytics summary:
//
//    initializing — no tickets ever joined
//    activating   — first tickets joined, none served yet
//    active       — sustained join + serve flow
//    mature       — ≥ 8 tickets served (stable operations evidence)
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import useAnalyticsSummary from '@/features/analytics/hooks/useAnalyticsSummary.js';

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

function derivePhase({ joined, served }) {
  if (!joined)        return PHASES.INITIALIZING;
  if (served >= 8)    return PHASES.MATURE;
  if (served >= 1)    return PHASES.ACTIVE;
  return PHASES.ACTIVATING;
}

export function useSystemPhase() {
  const { summary } = useAnalyticsSummary({ range: '30d', pollMs: 60_000 });
  const joined = summary?.totals?.joined ?? 0;
  const served = summary?.totals?.served ?? 0;
  const phase  = derivePhase({ joined, served });

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
    hasReached(target) {
      const order = [PHASES.INITIALIZING, PHASES.ACTIVATING, PHASES.ACTIVE, PHASES.MATURE];
      return order.indexOf(phase) >= order.indexOf(target);
    },
  }), [phase, enteredAt]);
}

export default useSystemPhase;
