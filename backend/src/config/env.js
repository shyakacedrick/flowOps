import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized environment configuration.
 * All process.env access goes through this module so we have a single
 * source of truth and a single place to validate required variables.
 */

const requiredVars = ['JWT_SECRET', 'MONGO_URI'];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.warn(
    `[env] Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in the values.'
  );
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api',

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/flowops',

  jwtSecret: process.env.JWT_SECRET || 'change_me_in_env',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

  corsOrigin: process.env.CORS_ORIGIN || '*',
};

env.isProd = env.nodeEnv === 'production';
env.isDev = env.nodeEnv === 'development';
env.isTest = env.nodeEnv === 'test';

export default env;
