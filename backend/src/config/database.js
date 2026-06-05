import mongoose from 'mongoose';
import env from './env.js';

/**
 * Connects to MongoDB. Exported as a function so the entry point (server.js)
 * controls the lifecycle and can fail fast on connection errors.
 */
export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    // eslint-disable-next-line no-console
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[db] Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      // eslint-disable-next-line no-console
      console.warn('[db] Mongoose disconnected');
    });

    return conn;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] MongoDB connection failed:', err.message);
    throw err;
  }
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};

export default connectDatabase;
