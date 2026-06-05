import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { success, created, noContent } from '../utils/apiResponse.js';
import Queue, { QUEUE_STATUSES } from '../models/Queue.js';
import Ticket, { TICKET_STATUSES } from '../models/Ticket.js';
import { USER_ROLES } from '../models/User.js';
import {
  logTicketCreated,
  logTicketStatusChange,
} from '../services/activityService.js';

const assertObjectId = (id, label = 'id') => {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

const orgScope = (user, baseFilter = {}) => {
  if (user.role === USER_ROLES.PLATFORM_ADMIN) return baseFilter;
  if (!user.organizationId) return { ...baseFilter, _id: null };
  return { ...baseFilter, organizationId: user.organizationId };
};

/**
 * Allowed state transitions for tickets. Keeps lifecycle consistent and
 * prevents nonsensical jumps like served -> waiting.
 */
const ALLOWED_TRANSITIONS = {
  waiting: ['serving', 'skipped', 'cancelled'],
  serving: ['served', 'skipped', 'cancelled'],
  served: [],
  skipped: [],
  cancelled: [],
};

const formatTicketNumber = (n) => String(n).padStart(3, '0');

/**
 * POST /api/tickets
 * Body: { queueId, customerName }
 */
export const createTicket = asyncHandler(async (req, res) => {
  const { queueId, customerName } = req.body || {};
  if (!queueId || !customerName) {
    throw ApiError.badRequest('queueId and customerName are required');
  }
  assertObjectId(queueId, 'queueId');

  const queue = await Queue.findOne(orgScope(req.user, { _id: queueId }));
  if (!queue) throw ApiError.notFound('Queue not found');

  if (queue.status !== QUEUE_STATUSES.ACTIVE) {
    throw ApiError.badRequest(`Cannot add tickets to a ${queue.status} queue`);
  }

  // Atomically increment the queue's counter to derive a unique ticket number.
  const updated = await Queue.findByIdAndUpdate(
    queue._id,
    { $inc: { ticketCounter: 1 } },
    { new: true }
  );
  const ticketNumber = formatTicketNumber(updated.ticketCounter);

  const ticket = await Ticket.create({
    ticketNumber,
    customerName,
    queueId: queue._id,
    organizationId: queue.organizationId,
    status: TICKET_STATUSES.WAITING,
    joinedAt: new Date(),
  });

  await logTicketCreated(ticket, req.user);
  return created(res, ticket);
});

/**
 * GET /api/tickets
 * Optional filters: ?queueId=...&status=waiting
 */
export const listTickets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.queueId) {
    assertObjectId(req.query.queueId, 'queueId');
    filter.queueId = req.query.queueId;
  }
  if (req.query.status) filter.status = req.query.status;

  const tickets = await Ticket.find(orgScope(req.user, filter))
    .sort({ joinedAt: 1 })
    .limit(Math.min(Number(req.query.limit) || 200, 1000));

  return success(res, tickets);
});

/**
 * GET /api/tickets/:id
 */
export const getTicket = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const ticket = await Ticket.findOne(orgScope(req.user, { _id: req.params.id }));
  if (!ticket) throw ApiError.notFound('Ticket not found');
  return success(res, ticket);
});

/**
 * PATCH /api/tickets/:id
 * Body: { status?, customerName? }
 */
export const updateTicket = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const ticket = await Ticket.findOne(orgScope(req.user, { _id: req.params.id }));
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const previousStatus = ticket.status;
  let statusChanged = false;

  if ('status' in (req.body || {})) {
    const next = req.body.status;
    if (!Object.values(TICKET_STATUSES).includes(next)) {
      throw ApiError.badRequest(
        `status must be one of: ${Object.values(TICKET_STATUSES).join(', ')}`
      );
    }
    if (next !== ticket.status) {
      const allowed = ALLOWED_TRANSITIONS[ticket.status] || [];
      if (!allowed.includes(next)) {
        throw ApiError.badRequest(
          `Cannot transition ticket from '${ticket.status}' to '${next}'`
        );
      }
      ticket.status = next;
      if (next === TICKET_STATUSES.SERVED) ticket.servedAt = new Date();
      statusChanged = true;
    }
  }

  if ('customerName' in (req.body || {})) {
    ticket.customerName = req.body.customerName;
  }

  await ticket.save();

  if (statusChanged) {
    await logTicketStatusChange(ticket, req.user, previousStatus);
  }

  return success(res, ticket);
});

/**
 * DELETE /api/tickets/:id
 */
export const deleteTicket = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const ticket = await Ticket.findOne(orgScope(req.user, { _id: req.params.id }));
  if (!ticket) throw ApiError.notFound('Ticket not found');
  await ticket.deleteOne();
  return noContent(res);
});

export default {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
};
