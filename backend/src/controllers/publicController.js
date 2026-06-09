// ============================================================================
//  publicController — no-auth endpoints for customers joining queues
// ----------------------------------------------------------------------------
//  Customers don't have FlowOps accounts. They land on /q/:queueId (typically
//  via a QR code in-store), submit their name + optional phone, and get a
//  ticket back. They can poll the ticket to watch their position drop.
//
//  Security posture: everything here is rate-limited at the route layer.
//  We never leak data beyond what a walk-in customer would see on a screen
//  in the lobby (queue name, org name, their own ticket).
// ============================================================================

import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success, created } from '../utils/apiResponse.js';
import Queue, { QUEUE_STATUSES } from '../models/Queue.js';
import Organization from '../models/Organization.js';
import Ticket, { TICKET_STATUSES } from '../models/Ticket.js';
import { logTicketCreated } from '../services/activityService.js';

const assertObjectId = (id, label = 'id') => {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

const formatTicketNumber = (n) => String(n).padStart(3, '0');

/**
 * Public-safe queue projection: nothing the customer shouldn't see in the
 * lobby. No counters, no internal flags.
 */
const publicQueueView = (queue, org, waitingCount) => ({
  _id: queue._id,
  name: queue.name,
  status: queue.status,
  waitingCount,
  organization: {
    _id: org._id,
    name: org.name,
    industry: org.industry,
  },
});

const publicTicketView = (ticket, positionInLine) => ({
  _id: ticket._id,
  ticketNumber: ticket.ticketNumber,
  customerName: ticket.customerName,
  status: ticket.status,
  joinedAt: ticket.joinedAt,
  servedAt: ticket.servedAt,
  // 1-based position; null when ticket is no longer waiting
  position: positionInLine,
});

/**
 * GET /api/public/queues/:queueId
 * Returns lobby-safe queue info for the join page.
 */
export const getPublicQueue = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  assertObjectId(queueId, 'queueId');

  const queue = await Queue.findById(queueId);
  if (!queue || queue.deletedAt) throw ApiError.notFound('Queue not found');

  const org = await Organization.findById(queue.organizationId);
  if (!org) throw ApiError.notFound('Organization not found');

  const waitingCount = await Ticket.countDocuments({
    queueId: queue._id,
    status: TICKET_STATUSES.WAITING,
    deletedAt: null,
  });

  return success(res, publicQueueView(queue, org, waitingCount));
});

/**
 * POST /api/public/queues/:queueId/tickets
 * Body: { customerName, phone? }
 *
 * Creates a ticket for an anonymous walk-in. Rate-limited at the route
 * layer to prevent spam (see publicRoutes.js).
 */
export const joinQueuePublic = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  assertObjectId(queueId, 'queueId');

  const { customerName, phone } = req.body || {};
  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    throw ApiError.badRequest('customerName is required');
  }
  if (phone && (typeof phone !== 'string' || phone.length > 32)) {
    throw ApiError.badRequest('phone must be a string up to 32 characters');
  }

  const queue = await Queue.findById(queueId);
  if (!queue || queue.deletedAt) throw ApiError.notFound('Queue not found');

  if (queue.status !== QUEUE_STATUSES.ACTIVE) {
    // 410 Gone reads better here than 400 — the resource exists but is
    // intentionally unavailable for joins.
    throw new ApiError(`This queue is currently ${queue.status}`, 410);
  }

  // Atomically bump the queue counter so two simultaneous joins don't collide.
  const updated = await Queue.findByIdAndUpdate(
    queue._id,
    { $inc: { ticketCounter: 1 } },
    { new: true }
  );
  const ticketNumber = formatTicketNumber(updated.ticketCounter);

  const ticket = await Ticket.create({
    ticketNumber,
    customerName: customerName.trim(),
    queueId: queue._id,
    organizationId: queue.organizationId,
    status: TICKET_STATUSES.WAITING,
    joinedAt: new Date(),
  });

  // Best-effort activity log; controllers shouldn't fail because logging did.
  await logTicketCreated(ticket, null);

  const position = await positionForWaitingTicket(ticket);
  return created(res, publicTicketView(ticket, position));
});

/**
 * GET /api/public/tickets/:ticketId
 * Lets a customer poll their own ticket for status + queue position.
 *
 * Security model: the ticket id is effectively a bearer token. Anyone
 * who has the id can read it. The id is a random ObjectId so guessing
 * one is infeasible. We deliberately do NOT expose other tickets' info.
 */
export const getPublicTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  assertObjectId(ticketId, 'ticketId');

  const ticket = await Ticket.findById(ticketId);
  if (!ticket || ticket.deletedAt) throw ApiError.notFound('Ticket not found');

  const position = await positionForWaitingTicket(ticket);
  return success(res, publicTicketView(ticket, position));
});

// ---------------------------------------------------------------------------

/**
 * Compute 1-based position in the waiting line. Returns null for tickets
 * that are no longer waiting (serving / served / skipped / cancelled).
 */
async function positionForWaitingTicket(ticket) {
  if (ticket.status !== TICKET_STATUSES.WAITING) return null;
  const ahead = await Ticket.countDocuments({
    queueId: ticket.queueId,
    status: TICKET_STATUSES.WAITING,
    deletedAt: null,
    joinedAt: { $lt: ticket.joinedAt },
  });
  return ahead + 1;
}

export default {
  getPublicQueue,
  joinQueuePublic,
  getPublicTicket,
};
