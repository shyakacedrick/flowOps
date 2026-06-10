// Auth integration tests — register validation, login, /me, refresh suspension.
import { describe, it, expect } from 'vitest';
import { api, registerOwner, seedAdmin, seedStaff } from './helpers.js';
import User, { USER_ROLES } from '../src/models/User.js';

describe('POST /api/auth/register', () => {
  it('requires name, email and password', async () => {
    const res = await api().post('/api/auth/register').send({ email: 'a@b.test' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects passwords shorter than 10 characters', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'X', email: 'x1@b.test', password: 'short1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/10 characters/i);
  });

  it('rejects passwords without a letter+number combination', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'X', email: 'x2@b.test', password: 'allletters' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/letter and one number/i);
  });

  it('rejects business_owner role with no company name', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({
        name: 'X',
        email: 'x3@b.test',
        password: 'TestPass123!',
        role: USER_ROLES.BUSINESS_OWNER,
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/company name is required/i);
  });

  it('rejects direct staff registration without an organization invite', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({
        name: 'X',
        email: 'x4@b.test',
        password: 'TestPass123!',
        role: USER_ROLES.STAFF,
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/organization invite/i);
  });

  it('rejects a second platform_admin self-registration', async () => {
    await seedAdmin(); // seed the first admin directly
    const res = await api()
      .post('/api/auth/register')
      .send({
        name: 'Sneaky',
        email: 'sneaky@b.test',
        password: 'TestPass123!',
        role: USER_ROLES.PLATFORM_ADMIN,
      });
    expect(res.status).toBe(403);
  });

  it('creates a business owner + organization in one call', async () => {
    const { user, token, organizationId } = await registerOwner({ company: 'Test Co' });
    expect(token).toBeTruthy();
    expect(user.role).toBe(USER_ROLES.BUSINESS_OWNER);
    expect(organizationId).toBeTruthy();
  });

  it('rejects duplicate email addresses', async () => {
    const { email } = await registerOwner();
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Dup', email, password: 'TestPass123!', company: 'Other' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 401 for an unknown email', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@b.test', password: 'TestPass123!' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for a wrong password', async () => {
    const { email } = await registerOwner();
    const res = await api()
      .post('/api/auth/login')
      .send({ email, password: 'WrongPass123!' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a suspended user', async () => {
    const { email, password, user } = await registerOwner();
    await User.findByIdAndUpdate(user.id, { suspendedAt: new Date() });
    const res = await api().post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects requests with a missing token', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid token', async () => {
    const res = await api()
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const { token, email } = await registerOwner();
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it('rejects access for a suspended user even with a valid token', async () => {
    const { token, user } = await registerOwner();
    await User.findByIdAndUpdate(user.id, { suspendedAt: new Date() });
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('seedStaff helper', () => {
  it('issues a working access token for a provisioned staff account', async () => {
    const { organizationId } = await registerOwner();
    const { token, user } = await seedStaff({ organizationId });
    expect(user.role).toBe(USER_ROLES.STAFF);
    expect(user.organizationId).toBe(String(organizationId));
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
