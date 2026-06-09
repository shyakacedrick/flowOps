// ============================================================================
//  publicRoutes — no-auth surface for the customer-facing join page
// ----------------------------------------------------------------------------
//  Mounted under /api/public. Every route here is rate-limited so the
//  endpoint can be safely exposed to the open internet.
// ============================================================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getPublicQueue,
  joinQueuePublic,
  getPublicTicket,
} from '../controllers/publicController.js';

const router = Router();

// 3 ticket creations per IP per minute. Real customers join once.
const joinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait a minute.' },
});

// Generous read limit — customers may poll their own ticket every few seconds.
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

router.get('/queues/:queueId',          readLimiter, getPublicQueue);
router.post('/queues/:queueId/tickets', joinLimiter, joinQueuePublic);
router.get('/tickets/:ticketId',        readLimiter, getPublicTicket);

export default router;
