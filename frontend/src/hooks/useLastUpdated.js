// "Updated Xs ago" tracker — derived from the central simulation's
// `lastUpdatedAt` timestamp, with a 1s wall-clock heartbeat so the label
// stays alive between engine events.
import { useEffect, useState } from 'react';
import { useSimulationSlice } from '../engine/SimulationProvider.jsx';

export function useLastUpdated() {
  const lastUpdatedAt = useSimulationSlice((s) => s.lastUpdatedAt);
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
