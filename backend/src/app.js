import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import pino from 'pino';

import env from './config/env.js';
import { pingDatabase } from './config/database.js';
import apiRoutes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

/**
 * Express application factory. Kept separate from server.js so it can
 * be imported into integration tests without binding a port.
 */
const app = express();

// ── Core security ──────────────────────────────────────────────────────────
app.disable('x-powered-by');
// Trust the first proxy (Render/Heroku/Fly/etc.) so req.ip + secure cookies
// work behind a load balancer. Safe in single-proxy environments.
app.set('trust proxy', 1);

app.use(
  helmet({
    // Allow our frontend (running on a different origin) to use API
    // responses such as JSON or CSV downloads. The default 'same-origin'
    // policy would break the SPA.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS allowlist ─────────────────────────────────────────────────────────
// Origins come from env.corsOrigins (array of explicit origins, or the
// literal '*' for dev). We also allow requests with no Origin header
// (curl, server-to-server, Postman) — they aren't cross-origin attacks.
const corsConfig =
  env.corsOrigins === '*'
    ? { origin: true, credentials: true }
    : {
        credentials: true,
        origin: (origin, cb) => {
          if (!origin) return cb(null, true);
          if (env.corsOrigins.includes(origin)) return cb(null, true);
          return cb(new Error(`CORS: origin ${origin} is not allowed`));
        },
      };
app.use(cors(corsConfig));

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Structured request logging ─────────────────────────────────────────────
// Pino is fast enough to leave on in production. We redact auth headers
// and cookies so secrets never land in log aggregators.
const logger = pino({
  level: env.logLevel,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    censor: '[redacted]',
  },
  transport:
    env.isDev && env.logLevel !== 'silent'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    // Don't log health checks — they spam.
    autoLogging: { ignore: (req) => req.url === '/health' },
  })
);

// ── Health ─────────────────────────────────────────────────────────────────
// Liveness probe + a small dependency check so orchestrators know whether
// the API can serve real traffic, not just bind a port.
app.get('/health', async (_req, res) => {
  const db = await pingDatabase();
  const ok = db.ok;
  res.status(ok ? 200 : 503).json({
    success: ok,
    data: {
      status: ok ? 'ok' : 'degraded',
      uptime: process.uptime(),
      db,
    },
  });
});

// ── API ────────────────────────────────────────────────────────────────────
app.use(env.apiPrefix, apiRoutes);

// ── 404 + Errors (must be last) ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
