// ──────────────────────────────────────────────────────────────────────────
//  Global test setup
//  - Spins up an in-process MongoDB (mongodb-memory-server) once per run.
//  - Points process.env.MONGO_URI at it BEFORE any model is imported so
//    every test gets the ephemeral DB.
//  - Drops all collections between tests for isolation.
// ──────────────────────────────────────────────────────────────────────────
import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Force test-mode env BEFORE anything else touches the config module.
// We SET (not delete) the mail-provider keys to empty strings so that
// dotenv.config() inside env.js (which respects pre-existing process.env
// values) won't repopulate them from a developer's local .env.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-prod';
process.env.BCRYPT_SALT_ROUNDS = '4'; // faster hashing in tests
process.env.RESEND_API_KEY = '';
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  // Silence noisy mongoose deprecation in tests.
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { maxPoolSize: 5 });
});

afterEach(async () => {
  // Wipe every collection between tests for clean isolation. Faster than
  // dropping the database (no index rebuilds).
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});
