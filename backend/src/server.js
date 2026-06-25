import http from 'node:http';
import app from './app.js';
import env from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initSentry, captureException } from './observability/sentry.js';

/**
 * Process entry point. Connects to MongoDB, then starts the HTTP server.
 * The HTTP server is exposed so future modules (e.g. Socket.IO) can attach
 * to the same instance without restructuring.
 */
const start = async () => {
  // Initialize Sentry FIRST so any startup error is captured.
  initSentry();
  await connectDatabase();

  const server = http.createServer(app);

  // Hook for future Real-Time Operations Monitoring (Socket.IO):
  //   import { attachRealtime } from './realtime/index.js';
  //   attachRealtime(server);

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] FlowOps API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`[server] Received ${signal}, shutting down gracefully...`);
    server.close(async (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('[server] Error closing HTTP server:', err);
      }
      try {
        await disconnectDatabase();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[server] Error disconnecting from DB:', e);
      }
      process.exit(err ? 1 : 0);
    });
  };

  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('[server] Unhandled Rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    // eslint-disable-next-line no-console
    console.error('[server] Uncaught Exception:', err);
    shutdown('uncaughtException');
  });
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
