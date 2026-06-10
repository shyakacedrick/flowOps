// Activity logging side-effect tests.
//
// Controllers fire-and-forget into activityService; we verify the writes
// land with the correct `type`, `organizationId`, and that org-scoped
// reads stay isolated between tenants.
import { describe, it, expect } from 'vitest';
import {
  api,
  registerOwner,
  registerSecondOrg,
  auth,
} from './helpers.js';
import Activity, { ACTIVITY_TYPES } from '../src/models/Activity.js';

describe('Activity side-effects', () => {
  it('writes an organization_created + user_registered activity on signup', async () => {
    const { organizationId, user } = await registerOwner({ company: 'Logged Co' });
    // activityService is fire-and-forget — give it a tick to flush.
    await new Promise((r) => setTimeout(r, 50));
    const activities = await Activity.find({
      organizationId,
    }).sort({ createdAt: 1 });
    const types = activities.map((a) => a.type);
    expect(types).toContain(ACTIVITY_TYPES.ORGANIZATION_CREATED);
    expect(types).toContain(ACTIVITY_TYPES.USER_REGISTERED);
    const userReg = activities.find((a) => a.type === ACTIVITY_TYPES.USER_REGISTERED);
    expect(String(userReg.actorId)).toBe(String(user.id));
  });

  it('writes a single queue_created activity when a queue is created', async () => {
    const owner = await registerOwner();
    const before = await Activity.countDocuments({
      type: ACTIVITY_TYPES.QUEUE_CREATED,
    });
    await api()
      .post('/api/queues')
      .set(auth(owner.token))
      .send({ name: 'Counter 1' });
    await new Promise((r) => setTimeout(r, 50));
    const after = await Activity.countDocuments({
      type: ACTIVITY_TYPES.QUEUE_CREATED,
    });
    expect(after - before).toBe(1);
  });

  it('scopes GET /api/activities to the caller organization', async () => {
    const orgA = await registerOwner({ company: 'Org A' });
    const orgB = await registerSecondOrg('Org B');
    await api()
      .post('/api/queues')
      .set(auth(orgA.token))
      .send({ name: 'A queue' });
    await api()
      .post('/api/queues')
      .set(auth(orgB.token))
      .send({ name: 'B queue' });
    await new Promise((r) => setTimeout(r, 50));

    const res = await api().get('/api/activities').set(auth(orgA.token));
    expect(res.status).toBe(200);
    const orgIds = res.body.data
      .map((a) => a.organizationId && String(a.organizationId))
      .filter(Boolean);
    expect(orgIds.every((id) => id === String(orgA.organizationId))).toBe(true);
  });
});
