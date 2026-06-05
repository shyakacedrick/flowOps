import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

/**
 * Centralized error handler. Normalizes thrown errors into the
 *   { success: false, message, details? }
 * envelope used across the API.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    );
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  } else if (err && err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});
    message = `Duplicate value for field${fields.length > 1 ? 's' : ''}: ${fields.join(', ')}`;
    details = err.keyValue;
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body';
  } else if (err && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
    message = err.message || message;
  } else if (err && err.message) {
    message = err.message;
  }

  if (!env.isTest) {
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`);
    if (statusCode >= 500) {
      // eslint-disable-next-line no-console
      console.error(err.stack || err);
    }
  }

  const payload = { success: false, message };
  if (details !== undefined) payload.details = details;
  if (!env.isProd && statusCode >= 500) payload.stack = err.stack;

  res.status(statusCode).json(payload);
};

export default errorHandler;
