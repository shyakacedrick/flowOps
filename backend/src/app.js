import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import apiRoutes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

/**
 * Express application factory. Kept separate from server.js so it can
 * be imported into integration tests without binding a port.
 *
 * Future-ready hooks (intentionally not implemented in Phase 1):
 *   - app.use('/socket.io', ...) — Real-time Operations Monitoring
 *   - app.use('/api/analytics', ...) — Analytics Engine
 *   - app.use('/api/insights', ...) — Smart Insights Engine
 *   - app.use('/api/notifications', ...) — Notifications
 *
 * They can be mounted under the same `apiRoutes` aggregator without
 * touching this file.
 */
const app = express();

// --- Core middleware -------------------------------------------------------
app.disable('x-powered-by');

const corsOrigin =
  env.corsOrigin === '*'
    ? '*'
    : env.corsOrigin.split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Health & API ----------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});

app.use(env.apiPrefix, apiRoutes);

// --- 404 + Errors (must be last) ------------------------------------------
app.use(notFound);
app.use(errorHandler);

export default app;
