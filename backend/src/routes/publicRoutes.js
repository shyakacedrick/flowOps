// ============================================================================
//  publicRoutes — no-auth surface for the customer-facing join page
// ----------------------------------------------------------------------------
//  Mounted under /api/public. Every route here is rate-limited so the
//  endpoint can be safely exposed to the open internet.
// ============================================================================

import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import {
  getPublicQueue,
  joinQueuePublic,
  getPublicTicket,
} from '../controllers/publicController.js';
import {
  getPublicInvite,
  acceptPublicInvite,
} from '../controllers/inviteController.js';
import { subscribe } from '../services/sseBroker.js';

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

// ── Public SSE stream for a single ticket ──────────────────────────────────
// Customers landing on /q/<queueId> get a ticket id back after joining. They
// open this stream to watch their own ticket flip status (waiting → serving →
// served). The ticket id IS the bearer here — same model as GET /tickets/:id.
// Rate-limited mildly so opening a thousand streams per IP is rejected; once
// connected, the only ongoing cost is a 15s heartbeat per socket.
const streamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many connections. Please wait a minute.' },
});
router.get('/events/tickets/:ticketId', streamLimiter, (req, res) => {
  const { ticketId } = req.params;
  if (!mongoose.isValidObjectId(ticketId)) {
    res.status(400).json({ success: false, message: 'Invalid ticketId' });
    return;
  }

  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection:      'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');

  const unsubscribe = subscribe(`ticket:${ticketId}`, res);
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* socket closed */ }
  }, 15_000);

  const cleanup = () => { clearInterval(heartbeat); unsubscribe(); };
  req.on('close', cleanup);
  req.on('end',   cleanup);
});

// Invite acceptance flow. Lookup is read-only and rate-limited mildly;
// accept is tighter to slow brute-force guessing of tokens.
const acceptLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait a minute.' },
});

router.get('/invites/:token',         readLimiter,   getPublicInvite);
router.post('/invites/:token/accept', acceptLimiter, acceptPublicInvite);

export default router;
