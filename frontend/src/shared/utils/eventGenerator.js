// ============================================================================
//  eventGenerator — dispatch helpers around the FlowOps engine
// ----------------------------------------------------------------------------
//  Gives feature code a small, intention-revealing API instead of dispatching
//  raw EVENT_TYPES strings everywhere. Pure functions of a dispatch ref.
// ============================================================================

import { EVENT_TYPES } from '@/engine/flowOpsEngine.js';

export function createEventDispatcher(dispatch) {
  return {
    addCustomer:    () => dispatch({ type: EVENT_TYPES.NEW_CUSTOMER }),
    serveCustomer:  () => dispatch({ type: EVENT_TYPES.SERVE_CUSTOMER }),
    skipCustomer:   () => dispatch({ type: EVENT_TYPES.SKIP_CUSTOMER }),
    tick:           () => dispatch({ type: EVENT_TYPES.TICK }),
    reset:          () => dispatch({ type: EVENT_TYPES.RESET }),
    idle:           () => dispatch({ type: EVENT_TYPES.IDLE_PERIOD }),
  };
}

/** A friendly, label-ready description of an engine event. */
export function describeEvent(event) {
  if (!event) return 'No activity';
  switch (event.type) {
    case EVENT_TYPES.NEW_CUSTOMER:    return `${event.name ?? 'Customer'} joined the queue`;
    case EVENT_TYPES.SERVE_CUSTOMER:  return `${event.name ?? 'Customer'} served`;
    case EVENT_TYPES.SKIP_CUSTOMER:   return `${event.name ?? 'Customer'} skipped`;
    case EVENT_TYPES.IDLE_PERIOD:     return 'Idle period';
    case EVENT_TYPES.RESET:           return 'Queue reset';
    case EVENT_TYPES.TICK:            return 'Clock tick';
    default:                          return 'System event';
  }
}
