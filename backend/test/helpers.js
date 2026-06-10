// Shared test helpers: app builder + auth bootstrappers.
//
// All helpers go through the real HTTP surface (supertest) — no
// controller-level shortcuts — so the tests exercise routing, middleware,
// validation and serialization exactly like a real client would.
import request from 'supertest';
import app from '../src/app.js';
import User, { USER_ROLES } from '../src/models/User.js';
import Organization from '../src/models/Organization.js';

export { app };
export const api = () => request(app);

let userCounter = 0;
const uniqueEmail = (label = 'user') => {
  userCounter += 1;
  return `${label}.${Date.now()}.${userCounter}@example.test`;
};

/**
 * Register a business owner via the public /auth/register endpoint.
 * Returns { user, token, organizationId, email, password }.
 */
export const registerOwner = async ({ company = 'Acme Inc' } = {}) => {
  const email = uniqueEmail('owner');
  const password = 'TestPass123!';
  const res = await api()
    .post('/api/auth/register')
    .send({ name: 'Owner', email, password, company });
  if (res.status !== 201) {
    throw new Error(`registerOwner failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    user: res.body.data.user,
    token: res.body.data.token,
    organizationId: res.body.data.user.organizationId,
    email,
    password,
  };
};

/**
 * Seed a staff user directly in the DB and return a signed-in token via
 * /auth/login. Staff cannot self-register, so we provision through the
 * model and then go through the public login endpoint.
 */
export const seedStaff = async ({ organizationId }) => {
  const email = uniqueEmail('staff');
  const password = 'TestPass123!';
  const passwordHash = await User.hashPassword(password);
  await User.create({
    name: 'Staffer',
    email,
    passwordHash,
    role: USER_ROLES.STAFF,
    organizationId,
  });
  const res = await api()
    .post('/api/auth/login')
    .send({ email, password });
  return { token: res.body.data.token, email, password, user: res.body.data.user };
};

/**
 * Seed a platform admin and sign in. Bypasses the bootstrap rule (only an
 * existing platform admin can register another) by writing the first one
 * directly through the model.
 */
export const seedAdmin = async () => {
  const email = uniqueEmail('admin');
  const password = 'TestPass123!';
  const passwordHash = await User.hashPassword(password);
  await User.create({
    name: 'Admin',
    email,
    passwordHash,
    role: USER_ROLES.PLATFORM_ADMIN,
    organizationId: null,
  });
  const res = await api()
    .post('/api/auth/login')
    .send({ email, password });
  return { token: res.body.data.token, email, password, user: res.body.data.user };
};

/**
 * Provision a second isolated organization (useful for cross-tenant tests).
 * Reuses registerOwner to keep parity with the public signup flow.
 */
export const registerSecondOrg = (name = 'Other Co') =>
  registerOwner({ company: name });

export const auth = (token) => ({ Authorization: `Bearer ${token}` });
