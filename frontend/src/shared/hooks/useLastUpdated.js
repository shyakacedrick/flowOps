// ============================================================================
//  useLastUpdated — wall-clock "fresh" tracker
// ----------------------------------------------------------------------------
//  Reports how long ago this component last mounted/updated. Independent of
//  any simulation engine — the chart that consumes it polls real data
//  separately and re-renders this component on each new payload, which is
//  what the label tracks.
// ============================================================================

import { useEffect, useRef, useState } from 'react';

export function useLastUpdated() {
  const lastUpdatedAt = useRef(Date.now()).current;
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) & 0xffff), 1000);
    return () => clearInterval(id);
  }, []);

  const seconds = Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 1000));
  return {
    seconds,
    fresh: seconds < 4,
    label: format(seconds),
  };
}

function format(s) {
  if (s < 2)  return 'Updated just now';
  if (s < 60) return `Updated ${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `Updated ${m}m ago`;
  return `Updated ${Math.floor(m / 60)}h ago`;
}

export default useLastUpdated;
