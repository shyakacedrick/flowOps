// ============================================================================
//  useStaffQueue — staff-picked "active queue" for the current operator
// ----------------------------------------------------------------------------
//  Staff workspace pages (dashboard, my-queue, service-desk) all need to
//  know which queue the operator is currently working. This hook owns:
//    • Loading the org's queues (delegates to useQueues)
//    • Persisting the chosen id to localStorage so it survives reloads
//    • Auto-picking the first active queue when no choice is stored
//      (or when the stored id no longer exists)
//
//  Returns: { queues, queueId, queue, setQueueId, status, error, refresh }
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueues } from '@/features/queue/hooks/useQueues.js';

const STORAGE_KEY = 'flowops.staffQueueId';

const readStored = () => {
  try { return localStorage.getItem(STORAGE_KEY) || null; } catch { return null; }
};
const writeStored = (id) => {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
};

export function useStaffQueue() {
  const { queues, status, error, refresh, ...rest } = useQueues();
  const [queueId, setQueueIdState] = useState(readStored);

  // Reconcile the stored id against the live list. If it points at a
  // queue that no longer exists, fall back to the first active queue.
  useEffect(() => {
    if (status !== 'ready') return;
    const exists = queueId && queues.some((q) => q._id === queueId);
    if (exists) return;
    const fallback =
      queues.find((q) => q.status === 'active') || queues[0] || null;
    const nextId = fallback?._id || null;
    if (nextId !== queueId) {
      setQueueIdState(nextId);
      writeStored(nextId);
    }
  }, [status, queues, queueId]);

  const setQueueId = useCallback((id) => {
    setQueueIdState(id);
    writeStored(id);
  }, []);

  const queue = useMemo(
    () => queues.find((q) => q._id === queueId) || null,
    [queues, queueId]
  );

  return {
    queues,
    queueId,
    queue,
    setQueueId,
    status,
    error,
    refresh,
    ...rest,
  };
}

export default useStaffQueue;
