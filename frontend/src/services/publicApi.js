// ============================================================================
//  publicApi — no-auth REST wrappers for the customer join flow
// ----------------------------------------------------------------------------
//  Every call goes through `request` with `auth: false` so the Bearer
//  header is never sent. The customer is anonymous.
// ============================================================================

import { request } from '@/services/api.js';

export const publicApi = {
  getQueue: (queueId) =>
    request(`/public/queues/${queueId}`, { auth: false }),

  joinQueue: (queueId, body) =>
    request(`/public/queues/${queueId}/tickets`, {
      method: 'POST',
      body,
      auth: false,
    }),

  getTicket: (ticketId) =>
    request(`/public/tickets/${ticketId}`, { auth: false }),
};

export default publicApi;
