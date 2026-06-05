import Activity, { ACTIVITY_TYPES } from '../models/Activity.js';

/**
 * Activity logging service.
 *
 * Controllers should never write to the Activity collection directly;
 * they call `logActivity` (or one of the helpers) so that:
 *   - logging logic stays in one place
 *   - failures never break the primary request (logged & swallowed)
 *   - future consumers (Socket.IO, Analytics, Smart Insights, Notifications)
 *     can be wired in here without touching controllers.
 */

const safeLog = async (doc) => {
  try {
    return await Activity.create(doc);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[activity] Failed to record activity:', err.message);
    return null;
  }
};

export const logActivity = ({
  type,
  description,
  organizationId = null,
  actorId = null,
  metadata = {},
}) => safeLog({ type, description, organizationId, actorId, metadata });

// --- Convenience helpers ---------------------------------------------------

export const logUserRegistered = (user) =>
  logActivity({
    type: ACTIVITY_TYPES.USER_REGISTERED,
    description: `User '${user.email}' registered`,
    organizationId: user.organizationId || null,
    actorId: user._id,
    metadata: { role: user.role },
  });

export const logUserLogin = (user) =>
  logActivity({
    type: ACTIVITY_TYPES.USER_LOGIN,
    description: `User '${user.email}' logged in`,
    organizationId: user.organizationId || null,
    actorId: user._id,
    metadata: { role: user.role },
  });

export const logOrganizationCreated = (organization, actor) =>
  logActivity({
    type: ACTIVITY_TYPES.ORGANIZATION_CREATED,
    description: `Organization '${organization.name}' created`,
    organizationId: organization._id,
    actorId: actor?._id || null,
  });

export const logQueueCreated = (queue, actor) =>
  logActivity({
    type: ACTIVITY_TYPES.QUEUE_CREATED,
    description: `Queue '${queue.name}' created`,
    organizationId: queue.organizationId,
    actorId: actor?._id || null,
    metadata: { queueId: queue._id },
  });

export const logQueueUpdated = (queue, actor, changes = {}) =>
  logActivity({
    type: ACTIVITY_TYPES.QUEUE_UPDATED,
    description: `Queue '${queue.name}' updated`,
    organizationId: queue.organizationId,
    actorId: actor?._id || null,
    metadata: { queueId: queue._id, changes },
  });

export const logQueueDeleted = (queue, actor) =>
  logActivity({
    type: ACTIVITY_TYPES.QUEUE_DELETED,
    description: `Queue '${queue.name}' deleted`,
    organizationId: queue.organizationId,
    actorId: actor?._id || null,
    metadata: { queueId: queue._id },
  });

export const logTicketCreated = (ticket, actor) =>
  logActivity({
    type: ACTIVITY_TYPES.TICKET_CREATED,
    description: `Customer '${ticket.customerName}' joined queue (#${ticket.ticketNumber})`,
    organizationId: ticket.organizationId,
    actorId: actor?._id || null,
    metadata: { ticketId: ticket._id, queueId: ticket.queueId },
  });

export const logTicketStatusChange = (ticket, actor, previousStatus) => {
  const map = {
    serving: ACTIVITY_TYPES.TICKET_SERVING,
    served: ACTIVITY_TYPES.TICKET_SERVED,
    skipped: ACTIVITY_TYPES.TICKET_SKIPPED,
    cancelled: ACTIVITY_TYPES.TICKET_CANCELLED,
  };
  const type = map[ticket.status];
  if (!type) return null;

  const verbs = {
    serving: 'is now being served',
    served: 'was served',
    skipped: 'was skipped',
    cancelled: 'was cancelled',
  };

  return logActivity({
    type,
    description: `Customer '${ticket.customerName}' (#${ticket.ticketNumber}) ${verbs[ticket.status]}`,
    organizationId: ticket.organizationId,
    actorId: actor?._id || null,
    metadata: {
      ticketId: ticket._id,
      queueId: ticket.queueId,
      from: previousStatus,
      to: ticket.status,
    },
  });
};

export default {
  logActivity,
  logUserRegistered,
  logUserLogin,
  logOrganizationCreated,
  logQueueCreated,
  logQueueUpdated,
  logQueueDeleted,
  logTicketCreated,
  logTicketStatusChange,
};
