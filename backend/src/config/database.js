import mongoose from 'mongoose';
import env from './env.js';

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1000;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Connect to MongoDB with bounded retry + exponential backoff.
 *
 *  - Pool size + selection timeout are env-tunable (see config/env.js).
 *  - We retry transient connection failures up to MAX_ATTEMPTS so a
 *    brief Atlas hiccup at boot doesn't crashloop the container.
 *  - The final failure is rethrown so the process exits cleanly and the
 *    orchestrator can decide what to do.
 */
export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const conn = await mongoose.connect(env.mongoUri, {
        maxPoolSize: env.mongoMaxPoolSize,
        serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
      });

      // eslint-disable-next-line no-console
      console.log(
        `[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name} ` +
          `(pool=${env.mongoMaxPoolSize})`
      );

      mongoose.connection.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error('[db] Mongoose connection error:', err.message);
      });
      mongoose.connection.on('disconnected', () => {
        // eslint-disable-next-line no-console
        console.warn('[db] Mongoose disconnected');
      });
      mongoose.connection.on('reconnected', () => {
        // eslint-disable-next-line no-console
        console.log('[db] Mongoose reconnected');
      });

      return conn;
    } catch (err) {
      const isLast = attempt === MAX_ATTEMPTS;
      // eslint-disable-next-line no-console
      console.error(
        `[db] MongoDB connection failed (attempt ${attempt}/${MAX_ATTEMPTS}): ${err.message}`
      );
      if (isLast) throw err;
      const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      // eslint-disable-next-line no-console
      console.log(`[db] Retrying in ${backoff}ms...`);
      await wait(backoff);
    }
  }
  // Unreachable, but TypeScript-checkers/linters appreciate the explicit return.
  return null;
};

/** Cheap liveness probe — used by /health. */
export const pingDatabase = async () => {
  const state = mongoose.connection.readyState; // 1 === connected
  if (state !== 1) return { ok: false, state };
  try {
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    return { ok: true, state, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, state, error: err.message };
  }
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};

export default connectDatabase;
