#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// seed-demo — (re)create the public demo workspace used by README links.
//
// Idempotent: every run wipes the demo org's queues + tickets and the two
// canned user accounts, then recreates everything from scratch. Safe to
// run against any environment, including prod (it only touches data
// scoped to the demo organization name).
//
// What it produces:
//   • Organization "FlowOps Demo" (industry: clinic, plan: starter)
//   • Owner   demo.owner@flowops.app  (password: Demo123!)
//   • Staff   demo.staff@flowops.app  (password: Demo123!)
//   • 3 active queues with a realistic mix of waiting / serving / served
//     tickets (so analytics + KPI tiles look alive immediately).
//
// Usage:
//   # local
//   npm run seed:demo
//
//   # against Atlas (PowerShell)
//   $env:MONGO_URI="mongodb+srv://…"
//   npm run seed:demo
// ──────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User, { USER_ROLES } from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Queue, { QUEUE_STATUSES } from '../src/models/Queue.js';
import Ticket, { TICKET_STATUSES } from '../src/models/Ticket.js';

const ORG_NAME = 'FlowOps Demo';
const OWNER_EMAIL = 'demo.owner@flowops.app';
const STAFF_EMAIL = 'demo.staff@flowops.app';
const DEMO_PASSWORD = 'Demo123!';

function ok(msg) {
  // eslint-disable-next-line no-console
  console.log(`[seed-demo] ${msg}`);
}

function redact(uri) {
  try {
    const u = new URL(uri);
    if (u.password) u.password = '***';
    if (u.username) u.username = u.username.replace(/.(?=.{2})/g, '*');
    return u.toString();
  } catch {
    return uri.replace(/\/\/[^@]+@/, '//***:***@');
  }
}

// Small helper: pad ticket numbers like A001, B002, etc.
const pad3 = (n) => String(n).padStart(3, '0');

// Build a ticket payload with realistic timestamps based on status.
function buildTicket({ queue, prefix, index, name, status, minutesAgo, serveOffsetMin }) {
  const joinedAt = new Date(Date.now() - minutesAgo * 60_000);
  const ticket = {
    ticketNumber: `${prefix}${pad3(index)}`,
    customerName: name,
    queueId: queue._id,
    organizationId: queue.organizationId,
    status,
    joinedAt,
  };
  if (status === TICKET_STATUSES.SERVED && serveOffsetMin != null) {
    ticket.servedAt = new Date(joinedAt.getTime() + serveOffsetMin * 60_000);
  }
  return ticket;
}

async function resetDemoOrg() {
  // Hard-delete any prior demo org (queues, tickets, users belong to it).
  const prior = await Organization.findOne({ name: ORG_NAME });
  if (prior) {
    const [queues, tickets, users] = await Promise.all([
      Queue.deleteMany({ organizationId: prior._id }),
      Ticket.deleteMany({ organizationId: prior._id }),
      User.deleteMany({ email: { $in: [OWNER_EMAIL, STAFF_EMAIL] } }),
    ]);
    await Organization.deleteOne({ _id: prior._id });
    ok(
      `cleared previous demo workspace ` +
        `(queues: ${queues.deletedCount}, tickets: ${tickets.deletedCount}, users: ${users.deletedCount})`
    );
  } else {
    // Even if no org existed, scrub the two canned accounts in case they
    // were created manually under a different org.
    await User.deleteMany({ email: { $in: [OWNER_EMAIL, STAFF_EMAIL] } });
  }
}

async function createUsers(orgId) {
  const passwordHash = await User.hashPassword(DEMO_PASSWORD);
  const [owner, staff] = await Promise.all([
    User.create({
      name: 'Demo Owner',
      email: OWNER_EMAIL,
      passwordHash,
      role: USER_ROLES.BUSINESS_OWNER,
      organizationId: orgId,
      emailVerifiedAt: new Date(),
    }),
    User.create({
      name: 'Demo Staff',
      email: STAFF_EMAIL,
      passwordHash,
      role: USER_ROLES.STAFF,
      organizationId: orgId,
      emailVerifiedAt: new Date(),
    }),
  ]);
  return { owner, staff };
}

async function createQueuesAndTickets(orgId) {
  // Three queues, three personalities.
  const [reception, consultation, pharmacy] = await Promise.all([
    Queue.create({
      name: 'Reception',
      organizationId: orgId,
      status: QUEUE_STATUSES.ACTIVE,
      ticketCounter: 8,
    }),
    Queue.create({
      name: 'Consultation',
      organizationId: orgId,
      status: QUEUE_STATUSES.ACTIVE,
      ticketCounter: 6,
    }),
    Queue.create({
      name: 'Pharmacy',
      organizationId: orgId,
      status: QUEUE_STATUSES.ACTIVE,
      ticketCounter: 5,
    }),
  ]);

  const tickets = [
    // ── Reception (A) — a couple served, one being served, the rest waiting
    buildTicket({ queue: reception, prefix: 'A', index: 1, name: 'Alice Mukamana',
      status: TICKET_STATUSES.SERVED, minutesAgo: 95, serveOffsetMin: 12 }),
    buildTicket({ queue: reception, prefix: 'A', index: 2, name: 'Benjamin Hakizimana',
      status: TICKET_STATUSES.SERVED, minutesAgo: 78, serveOffsetMin: 9 }),
    buildTicket({ queue: reception, prefix: 'A', index: 3, name: 'Claudine Ingabire',
      status: TICKET_STATUSES.SERVED, minutesAgo: 55, serveOffsetMin: 14 }),
    buildTicket({ queue: reception, prefix: 'A', index: 4, name: 'Daniel Niyonzima',
      status: TICKET_STATUSES.SKIPPED, minutesAgo: 40, serveOffsetMin: null }),
    buildTicket({ queue: reception, prefix: 'A', index: 5, name: 'Esther Uwase',
      status: TICKET_STATUSES.SERVING, minutesAgo: 18, serveOffsetMin: null }),
    buildTicket({ queue: reception, prefix: 'A', index: 6, name: 'Fabrice Manzi',
      status: TICKET_STATUSES.WAITING, minutesAgo: 12, serveOffsetMin: null }),
    buildTicket({ queue: reception, prefix: 'A', index: 7, name: 'Grace Iribagiza',
      status: TICKET_STATUSES.WAITING, minutesAgo: 6, serveOffsetMin: null }),
    buildTicket({ queue: reception, prefix: 'A', index: 8, name: 'Henri Tuyishime',
      status: TICKET_STATUSES.WAITING, minutesAgo: 2, serveOffsetMin: null }),

    // ── Consultation (B) — heavier waits, one cancelled
    buildTicket({ queue: consultation, prefix: 'B', index: 1, name: 'Ines Kayitesi',
      status: TICKET_STATUSES.SERVED, minutesAgo: 110, serveOffsetMin: 20 }),
    buildTicket({ queue: consultation, prefix: 'B', index: 2, name: 'Jean-Paul Habimana',
      status: TICKET_STATUSES.SERVED, minutesAgo: 80, serveOffsetMin: 22 }),
    buildTicket({ queue: consultation, prefix: 'B', index: 3, name: 'Kevine Mahoro',
      status: TICKET_STATUSES.CANCELLED, minutesAgo: 60, serveOffsetMin: null }),
    buildTicket({ queue: consultation, prefix: 'B', index: 4, name: 'Liliane Umutoni',
      status: TICKET_STATUSES.SERVING, minutesAgo: 32, serveOffsetMin: null }),
    buildTicket({ queue: consultation, prefix: 'B', index: 5, name: 'Moses Bizimana',
      status: TICKET_STATUSES.WAITING, minutesAgo: 14, serveOffsetMin: null }),
    buildTicket({ queue: consultation, prefix: 'B', index: 6, name: 'Nadine Mukantwari',
      status: TICKET_STATUSES.WAITING, minutesAgo: 4, serveOffsetMin: null }),

    // ── Pharmacy (C) — fast-moving line
    buildTicket({ queue: pharmacy, prefix: 'C', index: 1, name: 'Olivier Rugema',
      status: TICKET_STATUSES.SERVED, minutesAgo: 70, serveOffsetMin: 5 }),
    buildTicket({ queue: pharmacy, prefix: 'C', index: 2, name: 'Patricia Mutesi',
      status: TICKET_STATUSES.SERVED, minutesAgo: 50, serveOffsetMin: 4 }),
    buildTicket({ queue: pharmacy, prefix: 'C', index: 3, name: 'Quentin Ndayisaba',
      status: TICKET_STATUSES.SERVED, minutesAgo: 30, serveOffsetMin: 6 }),
    buildTicket({ queue: pharmacy, prefix: 'C', index: 4, name: 'Rachel Uwimana',
      status: TICKET_STATUSES.SERVING, minutesAgo: 8, serveOffsetMin: null }),
    buildTicket({ queue: pharmacy, prefix: 'C', index: 5, name: 'Samuel Karenzi',
      status: TICKET_STATUSES.WAITING, minutesAgo: 3, serveOffsetMin: null }),
  ];

  await Ticket.insertMany(tickets);

  return {
    queues: [reception, consultation, pharmacy],
    ticketCount: tickets.length,
  };
}

async function main() {
  ok(`connecting to ${redact(env.mongoUri)} …`);
  await mongoose.connect(env.mongoUri, {
    maxPoolSize: env.mongoMaxPoolSize,
    serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
  });

  await resetDemoOrg();

  // Create org first (without owner), then users, then back-fill ownerId.
  const org = await Organization.create({
    name: ORG_NAME,
    industry: 'clinic',
    plan: 'starter',
    description:
      'Read-only demo workspace showcasing FlowOps queues, tickets, and analytics. ' +
      'Recreated by `npm run seed:demo`.',
  });
  ok(`created organization "${org.name}" (id: ${org._id})`);

  const { owner, staff } = await createUsers(org._id);
  await Organization.updateOne({ _id: org._id }, { $set: { ownerId: owner._id } });
  ok(`created owner ${owner.email}`);
  ok(`created staff ${staff.email}`);

  const { queues, ticketCount } = await createQueuesAndTickets(org._id);
  ok(`created ${queues.length} queues (${queues.map((q) => q.name).join(', ')})`);
  ok(`inserted ${ticketCount} sample tickets`);

  ok('');
  ok('demo workspace ready. sign in with:');
  ok(`  owner → ${OWNER_EMAIL}  /  ${DEMO_PASSWORD}`);
  ok(`  staff → ${STAFF_EMAIL}  /  ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed-demo] failed:', err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
