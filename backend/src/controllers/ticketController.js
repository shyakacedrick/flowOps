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
import { publish as publishEvent } from '../services/sseBroker.js';

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

  const queue = await Queue.findOne(orgScope(req.user, { _id: queueId, deletedAt: null }));
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
  // Push typed event so connected dashboards prepend the new ticket
  // without waiting for the next poll tick.
  publishEvent(`org:${ticket.organizationId}`, 'ticket:created', ticket.toJSON());
  return created(res, ticket);
});

/**
 * GET /api/tickets
 * Optional filters: ?queueId=...&status=waiting
 * Soft-deleted tickets are always hidden from this endpoint.
 */
export const listTickets = asyncHandler(async (req, res) => {
  const filter = { deletedAt: null };
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
  const baseFilter = { _id: req.params.id };
  if (req.user.role !== USER_ROLES.PLATFORM_ADMIN) baseFilter.deletedAt = null;
  const ticket = await Ticket.findOne(orgScope(req.user, baseFilter));
  if (!ticket) throw ApiError.notFound('Ticket not found');
  return success(res, ticket);
});

/**
 * PATCH /api/tickets/:id
 * Body: { status?, customerName? }
 */
export const updateTicket = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const ticket = await Ticket.findOne(orgScope(req.user, { _id: req.params.id, deletedAt: null }));
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
      // Attribute the ticket to the staff member who picked it up. We
      // record both the timestamp (for accurate handle-time) and the
      // user id (for per-staff rankings). `servedById` sticks even if
      // the ticket later transitions to served/skipped/cancelled.
      if (next === TICKET_STATUSES.SERVING) {
        ticket.servingStartedAt = new Date();
        if (!ticket.servedById && req.user?._id) {
          ticket.servedById = req.user._id;
        }
      }
      if (next === TICKET_STATUSES.SERVED) {
        ticket.servedAt = new Date();
        // Edge case: a ticket may go waiting → cancelled/skipped without
        // a serving step (still attribute to the actor for audit), but the
        // handle-time logic gates on both servingStartedAt + servedAt so
        // those won't poison avgHandleMins.
        if (!ticket.servedById && req.user?._id) {
          ticket.servedById = req.user._id;
        }
      }
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

  // Push to both the org channel (dashboards) and the ticket channel
  // (the customer's public page subscribes to this to see live position
  // / status updates without polling).
  const payload = ticket.toJSON();
  publishEvent(`org:${ticket.organizationId}`, 'ticket:updated', payload);
  publishEvent(`ticket:${ticket._id}`, 'ticket:updated', payload);

  return success(res, ticket);
});

/**
 * DELETE /api/tickets/:id
 * Soft-delete — tombstones the ticket so historical analytics and
 * activity entries that reference it remain coherent.
 */
export const deleteTicket = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const ticket = await Ticket.findOne(orgScope(req.user, { _id: req.params.id, deletedAt: null }));
  if (!ticket) throw ApiError.notFound('Ticket not found');
  ticket.deletedAt = new Date();
  await ticket.save();
  publishEvent(`org:${ticket.organizationId}`, 'ticket:deleted', { _id: ticket._id, queueId: ticket.queueId });
  return noContent(res);
});

export default {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
};
