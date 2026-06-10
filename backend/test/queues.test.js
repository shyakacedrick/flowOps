// Queue routing tests — org scoping, role enforcement, restore/include-deleted.
import { describe, it, expect } from 'vitest';
import {
  api,
  registerOwner,
  registerSecondOrg,
  seedStaff,
  seedAdmin,
  auth,
} from './helpers.js';

const createQueue = (token, body = { name: 'Lobby' }) =>
  api().post('/api/queues').set(auth(token)).send(body);

describe('Queue list/get scoping', () => {
  it("only returns the caller's organization queues", async () => {
    const orgA = await registerOwner({ company: 'Org A' });
    const orgB = await registerSecondOrg('Org B');
    await createQueue(orgA.token, { name: 'A-Lobby' });
    await createQueue(orgB.token, { name: 'B-Lobby' });

    const res = await api().get('/api/queues').set(auth(orgA.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('A-Lobby');
  });

  it("returns 404 when an owner tries to read another org's queue by id", async () => {
    const orgA = await registerOwner({ company: 'Org A' });
    const orgB = await registerSecondOrg('Org B');
    const created = await createQueue(orgA.token, { name: 'A-Lobby' });
    const queueId = created.body.data._id || created.body.data.id;
    const res = await api().get(`/api/queues/${queueId}`).set(auth(orgB.token));
    expect(res.status).toBe(404);
  });
});

describe('Queue write authorization', () => {
  it('forbids staff from creating a queue', async () => {
    const { organizationId } = await registerOwner();
    const { token } = await seedStaff({ organizationId });
    const res = await createQueue(token, { name: 'StaffTry' });
    expect(res.status).toBe(403);
  });

  it('forbids staff from deleting a queue', async () => {
    const owner = await registerOwner();
    const created = await createQueue(owner.token, { name: 'Test' });
    const queueId = created.body.data._id || created.body.data.id;
    const { token } = await seedStaff({ organizationId: owner.organizationId });
    const res = await api().delete(`/api/queues/${queueId}`).set(auth(token));
    expect(res.status).toBe(403);
  });

  it('forbids owners from restoring a soft-deleted queue', async () => {
    const owner = await registerOwner();
    const created = await createQueue(owner.token, { name: 'Doomed' });
    const queueId = created.body.data._id || created.body.data.id;
    await api().delete(`/api/queues/${queueId}`).set(auth(owner.token));
    const res = await api().post(`/api/queues/${queueId}/restore`).set(auth(owner.token));
    expect(res.status).toBe(403);
  });

  it('allows a platform admin to restore a soft-deleted queue', async () => {
    const owner = await registerOwner();
    const created = await createQueue(owner.token, { name: 'Recoverable' });
    const queueId = created.body.data._id || created.body.data.id;
    await api().delete(`/api/queues/${queueId}`).set(auth(owner.token));
    const admin = await seedAdmin();
    const res = await api()
      .post(`/api/queues/${queueId}/restore`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data.deletedAt).toBeNull();
  });
});

describe('Queue includeDeleted', () => {
  it('hides soft-deleted queues from non-admin even with includeDeleted=true', async () => {
    const owner = await registerOwner();
    const created = await createQueue(owner.token, { name: 'Ghost' });
    const queueId = created.body.data._id || created.body.data.id;
    await api().delete(`/api/queues/${queueId}`).set(auth(owner.token));
    const res = await api()
      .get('/api/queues?includeDeleted=true')
      .set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data.map((q) => q._id || q.id)).not.toContain(String(queueId));
  });

  it('returns soft-deleted queues to a platform admin with includeDeleted=true', async () => {
    const owner = await registerOwner();
    const created = await createQueue(owner.token, { name: 'Ghost' });
    const queueId = created.body.data._id || created.body.data.id;
    await api().delete(`/api/queues/${queueId}`).set(auth(owner.token));
    const admin = await seedAdmin();
    const res = await api()
      .get('/api/queues?includeDeleted=true')
      .set(auth(admin.token));
    const ids = res.body.data.map((q) => q._id || q.id).map(String);
    expect(ids).toContain(String(queueId));
  });
});
