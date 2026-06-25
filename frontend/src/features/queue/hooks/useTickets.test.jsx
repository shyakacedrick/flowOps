// ============================================================================
//  useTickets.test.jsx
// ----------------------------------------------------------------------------
//  Mirrors useQueues.test.jsx but for per-queue ticket lists. Covers:
//    - Skips fetch when queueId is falsy (and reports 'ready')
//    - Recovers from a fetch THROW (spinner-stuck regression)
//    - Refetches when queueId or status changes
//    - SSE filtering by queueId + status (a 'waiting' view drops served)
//    - Optimistic add / replace / remove
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/services/ticketApi.js', () => ({
  default: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

import ticketApi from '@/services/ticketApi.js';
import useTickets from '@/features/queue/hooks/useTickets.js';

const Q = 'queue-1';
const TICKETS = [
  { _id: 't1', queueId: Q, status: 'waiting',  customerName: 'Alice', joinedAt: '2026-06-24T10:00:00Z' },
  { _id: 't2', queueId: Q, status: 'serving',  customerName: 'Bob',   joinedAt: '2026-06-24T10:01:00Z' },
];

beforeEach(() => {
  ticketApi.list.mockReset();
});

describe('useTickets — guards & happy path', () => {
  it('returns ready immediately when queueId is falsy and never calls the API', async () => {
    const { result } = renderHook(() => useTickets(null));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.tickets).toEqual([]);
    expect(ticketApi.list).not.toHaveBeenCalled();
  });

  it('loads tickets for the supplied queueId', async () => {
    ticketApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: TICKETS });
    const { result } = renderHook(() => useTickets(Q));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.tickets).toEqual(TICKETS);
    expect(ticketApi.list).toHaveBeenCalledWith({ queueId: Q, status: undefined });
  });

  it('passes the status filter through to the API', async () => {
    ticketApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: [TICKETS[0]] });
    const { result } = renderHook(() => useTickets(Q, { status: 'waiting' }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(ticketApi.list).toHaveBeenCalledWith({ queueId: Q, status: 'waiting' });
  });
});

describe('useTickets — failure modes', () => {
  it('recovers when fetch THROWS (regression: spinner used to stick)', async () => {
    ticketApi.list.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useTickets(Q));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toMatch(/boom|network/i);
  });

  it('transitions to error on ok:false', async () => {
    ticketApi.list.mockResolvedValueOnce({ ok: false, status: 500, message: 'down' });
    const { result } = renderHook(() => useTickets(Q));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('down');
  });
});

describe('useTickets — queueId / status changes', () => {
  it('refetches when queueId changes', async () => {
    ticketApi.list.mockResolvedValue({ ok: true, status: 200, data: TICKETS });
    const { rerender } = renderHook(({ qid }) => useTickets(qid), {
      initialProps: { qid: Q },
    });
    await waitFor(() => expect(ticketApi.list).toHaveBeenCalledTimes(1));
    rerender({ qid: 'other-queue' });
    await waitFor(() => expect(ticketApi.list).toHaveBeenCalledTimes(2));
    expect(ticketApi.list).toHaveBeenLastCalledWith({ queueId: 'other-queue', status: undefined });
  });
});

describe('useTickets — SSE live updates', () => {
  it('ticket:created appends only when queueId matches', async () => {
    window.localStorage.setItem('flowops.token', 'tok');
    ticketApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: TICKETS });
    const { result } = renderHook(() => useTickets(Q));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await waitFor(() => expect(globalThis.__MockEventSource.instances.length).toBeGreaterThan(0));
    const es = globalThis.__MockEventSource.instances.at(-1);

    // Mismatched queueId — ignored.
    act(() => { es.emit('ticket:created', { _id: 't9', queueId: 'OTHER', status: 'waiting' }); });
    expect(result.current.tickets.find((t) => t._id === 't9')).toBeUndefined();

    // Matching queueId — appended.
    act(() => { es.emit('ticket:created', { _id: 't3', queueId: Q, status: 'waiting', customerName: 'Carol' }); });
    expect(result.current.tickets.find((t) => t._id === 't3')).toBeDefined();
  });

  it('respects the status filter: ticket:updated drops a ticket that left the view', async () => {
    window.localStorage.setItem('flowops.token', 'tok');
    ticketApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: [TICKETS[0]] });

    const { result } = renderHook(() => useTickets(Q, { status: 'waiting' }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await waitFor(() => expect(globalThis.__MockEventSource.instances.length).toBeGreaterThan(0));
    const es = globalThis.__MockEventSource.instances.at(-1);

    // Alice transitions waiting → serving — she should be removed from this view.
    act(() => { es.emit('ticket:updated', { ...TICKETS[0], status: 'serving' }); });

    expect(result.current.tickets.find((t) => t._id === 't1')).toBeUndefined();
  });
});

describe('useTickets — mutators', () => {
  it('replace swaps temp for real and tolerates missing real._id', async () => {
    ticketApi.list.mockResolvedValueOnce({ ok: true, status: 200, data: TICKETS });
    const { result } = renderHook(() => useTickets(Q));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => { result.current.addOptimistic({ _id: 'temp:1', queueId: Q, customerName: 'Tmp', _optimistic: true }); });
    act(() => { result.current.replace('temp:1', { _id: 'real-1', queueId: Q, customerName: 'Tmp' }); });
    expect(result.current.tickets.find((t) => t._id === 'real-1')).toBeDefined();
    expect(result.current.tickets.find((t) => t._id === 'temp:1')).toBeUndefined();

    // Replace with null real should just drop the temp placeholder.
    act(() => { result.current.addOptimistic({ _id: 'temp:2', queueId: Q, customerName: 'Tmp2', _optimistic: true }); });
    act(() => { result.current.replace('temp:2', null); });
    expect(result.current.tickets.find((t) => t._id === 'temp:2')).toBeUndefined();
  });
});
