import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp — eased count animation from 0 → target.
 * - `active`: when true, animation runs.
 * - `decimals`: keep fractional precision (e.g. 4.8).
 * - `duration`: ms.
 */
export function useCountUp(target, { active = true, duration = 1400, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  const rafRef = useRef();
  const startRef = useRef();

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(target);
      return;
    }
    startRef.current = null;
    const tick = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      const next = target * eased;
      setValue(
        decimals > 0 ? Number(next.toFixed(decimals)) : Math.round(next)
      );
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active, duration, decimals]);

  return value;
}
