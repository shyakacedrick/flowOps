import { defineConfig } from 'vitest/config';

/**
 * Backend integration test config.
 *
 * - `pool: forks` + `singleFork: true` keeps the in-memory Mongo + the
 *   shared mongoose connection scoped to one process. Running suites in
 *   parallel against the same connection causes order-dependent flake.
 * - Generous timeouts because mongodb-memory-server downloads + boots a
 *   real mongod binary on first run.
 * - `setupFiles` boots Mongo once and resets collections between tests.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    setupFiles: ['./test/setup.js'],
    globals: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // These are merged into process.env BEFORE any test file (or its
    // imports) loads. dotenv.config() inside the app respects existing
    // values, so this is how we keep real SMTP/Resend creds and a noisy
    // bcrypt cost out of the test run.
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      JWT_SECRET: 'test-secret-do-not-use-in-prod',
      BCRYPT_SALT_ROUNDS: '4',
      SMTP_HOST: '',
      RESEND_API_KEY: '',
    },
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    // Share the module graph across files in the worker. Without this,
    // vitest reloads every src file per test file, which causes
    // mongoose.model('User', ...) to run twice and throw OverwriteModelError.
    isolate: false,
    reporters: ['default'],
    silent: false,
  },
});
