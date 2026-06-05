// ============================================================================
//  useValueFlash
// ----------------------------------------------------------------------------
//  Detects when a numeric (or any === comparable) value changes and emits a
//  short-lived "flash" signal that components can use to drive shimmer / glow
//  / pulse animations. Returns:
//
//    {
//      flashing : boolean   — true for `duration` ms after a change
//      key      : number    — increments per flash; use as React key
//      direction: 'up'|'down'|'flat'   — change direction
//    }
//
//  Pure timing primitive — does NOT mutate the value itself.
// ============================================================================

import { useEffect, useRef, useState } from 'react';

export function useValueFlash(value, { duration = 700 } = {}) {
  const prevRef = useRef(value);
  const [state, setState] = useState({ flashing: false, key: 0, direction: 'flat' });

  useEffect(() => {
    const prev = prevRef.current;
    if (value === prev) return undefined;

    const direction =
      typeof value === 'number' && typeof prev === 'number'
        ? value > prev
          ? 'up'
          : value < prev
            ? 'down'
            : 'flat'
        : 'flat';

    prevRef.current = value;
    setState((s) => ({ flashing: true, key: s.key + 1, direction }));

    const id = setTimeout(
      () => setState((s) => ({ ...s, flashing: false })),
      duration,
    );
    return () => clearTimeout(id);
  }, [value, duration]);

  return state;
}
