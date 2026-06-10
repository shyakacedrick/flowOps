// ============================================================================
//  eventsRoutes — Server-Sent Events streams (authenticated)
// ----------------------------------------------------------------------------
//  GET /api/events/org
//    Long-lived SSE stream. Authenticates the user, subscribes the
//    connection to that user's org channel, and pushes:
//      - activity:new      (whenever an Activity row is created for the org)
//      - ticket:created    (POST /tickets, POST /public/queues/:id/tickets)
//      - ticket:updated    (PATCH /tickets/:id)
//      - ticket:deleted    (DELETE /tickets/:id)
//      - queue:created     (POST /queues)
//      - queue:updated     (PATCH /queues/:id, restore)
//      - queue:deleted     (DELETE /queues/:id)
//
//  Authentication notes:
//    `EventSource` cannot set custom headers, so the access token is passed
//    as a `?token=` query parameter. The token is identical to the bearer
//    token used for REST \u2014 same JWT, same revocation check.
//
//  Platform admins don't have an organizationId, so they get a synthetic
//  channel that simply never receives events; admin pages still poll for
//  cross-tenant data. (A future enhancement could broadcast everything to
//  a `platform:admin` channel.)
// ============================================================================

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';
import RevokedToken from '../models/RevokedToken.js';
import { subscribe } from '../services/sseBroker.js';

const router = Router();

// Heartbeat keeps the connection alive through idle proxies (15s).
const HEARTBEAT_MS = 15_000;

const writeSseHeaders = (res) => {
  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection:      'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering if present
  });
  // Prelude: ":" is an SSE comment. Forces the client past response headers.
  res.write(': connected\n\n');
};

// ────────────────────────────────────────────────────────────────────────────
//  Authed stream for owner/staff/admin tabs.
// ────────────────────────────────────────────────────────────────────────────
router.get('/org', async (req, res) => {
  const token = req.query.token;
  if (!token || typeof token !== 'string') {
    res.status(401).json({ success: false, message: 'token query param is required' });
    return;
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    const code = err instanceof jwt.TokenExpiredError ? 'expired' : 'invalid';
    res.status(401).json({ success: false, message: `Authentication token is ${code}` });
    return;
  }

  if (decoded.jti) {
    const revoked = await RevokedToken.exists({ jti: decoded.jti });
    if (revoked) {
      res.status(401).json({ success: false, message: 'Session has been revoked' });
      return;
    }
  }

  const user = await User.findById(decoded.sub);
  if (!user || user.suspendedAt) {
    res.status(401).json({ success: false, message: 'Account not available' });
    return;
  }

  // Subscribe to the org channel. Platform admins (no org) just open a
  // stream that never receives events — they keep using REST/polling.
  const channel = user.organizationId
    ? `org:${user.organizationId}`
    : `org:__platform_admin_${user._id}`;

  writeSseHeaders(res);
  const unsubscribe = subscribe(channel, res);

  // Periodic heartbeat comment so reverse proxies don't kill the socket.
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      /* socket closed — cleanup below will run */
    }
  }, HEARTBEAT_MS);

  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe();
  };
  req.on('close', cleanup);
  req.on('end',   cleanup);
});

export default router;
