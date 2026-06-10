// Ticket state-machine + cross-tenant tests.
import { describe, it, expect } from 'vitest';
import {
  api,
  registerOwner,
  registerSecondOrg,
  auth,
} from './helpers.js';

const createQueue = (token, body) =>
  api().post('/api/queues').set(auth(token)).send(body);

const createTicket = (token, queueId, customerName = 'Alice') =>
  api()
    .post('/api/tickets')
    .set(auth(token))
    .send({ queueId, customerName });

const patchTicket = (token, id, body) =>
  api().patch(`/api/tickets/${id}`).set(auth(token)).send(body);

const seedQueueAndTicket = async (owner) => {
  const q = await createQueue(owner.token, { name: 'Lobby' });
  const queueId = q.body.data._id || q.body.data.id;
  const t = await createTicket(owner.token, queueId);
  const ticketId = t.body.data._id || t.body.data.id;
  return { queueId, ticketId };
};

describe('Ticket creation', () => {
  it('assigns a zero-padded ticket number and sets status waiting', async () => {
    const owner = await registerOwner();
    const { ticketId } = await seedQueueAndTicket(owner);
    const res = await api().get(`/api/tickets/${ticketId}`).set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('waiting');
    expect(res.body.data.ticketNumber).toMatch(/^\d{3}$/);
  });

  it('rejects ticket creation on a paused queue', async () => {
    const owner = await registerOwner();
    const q = await createQueue(owner.token, { name: 'Lobby' });
    const queueId = q.body.data._id || q.body.data.id;
    await api()
      .patch(`/api/queues/${queueId}`)
      .set(auth(owner.token))
      .send({ status: 'paused' });
    const res = await createTicket(owner.token, queueId);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/paused/i);
  });
});

describe('Ticket state machine', () => {
  it('allows waiting → serving → served and sets servedAt', async () => {
    const owner = await registerOwner();
    const { ticketId } = await seedQueueAndTicket(owner);

    let res = await patchTicket(owner.token, ticketId, { status: 'serving' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('serving');

    res = await patchTicket(owner.token, ticketId, { status: 'served' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('served');
    expect(res.body.data.servedAt).toBeTruthy();
  });

  it('rejects waiting → served directly', async () => {
    const owner = await registerOwner();
    const { ticketId } = await seedQueueAndTicket(owner);
    const res = await patchTicket(owner.token, ticketId, { status: 'served' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot transition/i);
  });

  it('rejects served → waiting (terminal state)', async () => {
    const owner = await registerOwner();
    const { ticketId } = await seedQueueAndTicket(owner);
    await patchTicket(owner.token, ticketId, { status: 'serving' });
    await patchTicket(owner.token, ticketId, { status: 'served' });
    const res = await patchTicket(owner.token, ticketId, { status: 'waiting' });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown status value', async () => {
    const owner = await registerOwner();
    const { ticketId } = await seedQueueAndTicket(owner);
    const res = await patchTicket(owner.token, ticketId, { status: 'banana' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/status must be one of/i);
  });

  it('allows waiting → cancelled but blocks cancelled → served', async () => {
    const owner = await registerOwner();
    const { ticketId } = await seedQueueAndTicket(owner);
    let res = await patchTicket(owner.token, ticketId, { status: 'cancelled' });
    expect(res.status).toBe(200);
    res = await patchTicket(owner.token, ticketId, { status: 'served' });
    expect(res.status).toBe(400);
  });
});

describe('Ticket cross-tenant isolation', () => {
  it("forbids another org's owner from patching the ticket (404)", async () => {
    const orgA = await registerOwner({ company: 'Org A' });
    const orgB = await registerSecondOrg('Org B');
    const { ticketId } = await seedQueueAndTicket(orgA);
    const res = await patchTicket(orgB.token, ticketId, { status: 'serving' });
    expect(res.status).toBe(404);
  });
});
