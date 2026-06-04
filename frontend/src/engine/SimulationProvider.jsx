// ============================================================================
//  SimulationProvider — React bindings for the central SimulationEngine
// ----------------------------------------------------------------------------
//  This file is the ONLY surface React code uses to consume the simulation.
//  It mounts the singleton engine, starts/stops its heartbeat with the
//  component lifecycle, and exposes a small, tree-shakeable hook API:
//
//      useSimulation()                — full snapshot (re-renders on change)
//      useSimulationSlice(selector)   — derived value (Object.is comparison)
//      useSimulationDispatch()        — manual queue events
//      useSimulationControls()        — start / stop / reset / toggle
//
//  Backwards-compat aliases (`useFlowOps`, `useFlowOpsDispatch`, etc.) are
//  exported so existing consumers keep working unchanged.
// ============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import {
  simulation,
  EVENT_TYPES,
  TIME,
} from './simulationEngine.js';

const SimulationCtx = createContext(simulation);

/**
 * Root provider. Starts the centralized simulation on mount, stops it on
 * unmount. Mount ONCE at the application root.
 */
export function SimulationProvider({ children, autoStart = true }) {
  useEffect(() => {
    if (autoStart) simulation.start();
    return () => {
      // Note: we intentionally do NOT stop the engine on hot-reload teardown
      // in development because React StrictMode mounts/unmounts twice. Stop
      // only when the page genuinely unloads.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SimulationCtx.Provider value={simulation}>
      {children}
    </SimulationCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
//  Hooks
// ---------------------------------------------------------------------------

/** Full simulation snapshot. Re-renders on every state mutation. */
export function useSimulation() {
  const store = useContext(SimulationCtx);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/**
 * Derived-value hook. Only re-renders when the selected value changes
 * (`Object.is`). Prefer this over `useSimulation()` for cheap subscriptions.
 *
 *   const queueLen = useSimulationSlice((s) => s.queue.length);
 *
 * The result is cached so `getSnapshot` is referentially stable while the
 * derived value hasn't changed — required by `useSyncExternalStore` to
 * avoid an infinite render loop when selectors construct new objects.
 */
export function useSimulationSlice(selector) {
  const store = useContext(SimulationCtx);
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const cacheRef = useRef({ source: null, value: undefined, has: false });

  const getSnapshot = useCallback(() => {
    const source = store.getSnapshot();
    const cache  = cacheRef.current;
    // Same upstream snapshot → reuse cached selection.
    if (cache.has && cache.source === source) return cache.value;
    const next = selectorRef.current(source);
    // Snapshot changed but selection didn't → keep stable reference.
    if (cache.has && Object.is(cache.value, next)) {
      cache.source = source;
      return cache.value;
    }
    cache.source = source;
    cache.value  = next;
    cache.has    = true;
    return next;
  }, [store]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/** Dispatch manual events (e.g. button-triggered NEW_CUSTOMER / SERVE_CUSTOMER). */
export function useSimulationDispatch() {
  const store = useContext(SimulationCtx);
  return store.dispatch;
}

/** Pause / resume / reset controls. Stable identity. */
export function useSimulationControls() {
  const store = useContext(SimulationCtx);
  const running = useSimulationSlice((s) => s.running);
  return useMemo(
    () => ({
      running,
      start:  () => store.start(),
      stop:   () => store.stop(),
      pause:  () => store.stop(),
      resume: () => store.start(),
      toggle: () => store.toggle(),
      reset:  () => store.reset(),
    }),
    [store, running],
  );
}

// ---------------------------------------------------------------------------
//  Re-exports
// ---------------------------------------------------------------------------

export { EVENT_TYPES, TIME };
