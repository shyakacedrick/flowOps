import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import pino from 'pino';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import env from './config/env.js';
import { pingDatabase } from './config/database.js';
import apiRoutes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

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
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            // In dev we don't need the verbose req/res object dumps for every
            // healthy request — the one-line summary from `customSuccessMessage`
            // below is enough. Errors still get full context because the error
            // block isn't ignored.
            ignore: 'pid,hostname,req,res,reqId,responseTime',
            messageFormat: '{msg}',
          },
        }
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
    // Replace pino-http's default "request completed" with a single readable
    // line per request: `GET /api/queues -> 304 (931ms)`. We use
    // `originalUrl` (not `url`) so the full path including mount prefix
    // shows up — otherwise everything under `/api/queues` logs as just `/`.
    // ASCII arrow (not →) so Windows consoles render it without garbling.
    customSuccessMessage: (req, res, responseTime) =>
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Math.round(responseTime)}ms)`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.originalUrl} -> ${res.statusCode} ${err?.message || ''}`.trim(),
    // Don't log health checks or SSE streams — they spam. SSE in particular
    // is a long-lived connection that always ends with `request aborted`
    // when the client disconnects, which is normal lifecycle, not an error.
    autoLogging: {
      ignore: (req) =>
        req.url === '/health' ||
        req.url.startsWith('/api/events/') ||
        req.url.startsWith('/api/public/events/'),
    },
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

// ── Static uploads (org logos, etc.) ───────────────────────────────────────
// Mounted AFTER /api so a request like /uploads/... can't collide with an
// API route. helmet's `crossOriginResourcePolicy: 'cross-origin'` above lets
// the SPA on a different origin load these images, and `fallthrough: false`
// keeps a missing file as a 404 (not handed to the SPA's notFound handler,
// which would render a JSON 404 — which is exactly what we want anyway).
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    fallthrough: false,
    index: false,
    dotfiles: 'deny',
    maxAge: '7d',
    setHeaders: (res) => {
      // Lock down the response so the uploaded asset can never be parsed as
      // HTML or executed as a script (defence-in-depth for SVG uploads).
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
    },
  })
);

// ── 404 + Errors (must be last) ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
