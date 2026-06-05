import ApiError from '../utils/ApiError.js';

/**
 * Catches requests that didn't match any route and forwards a 404 to
 * the global error handler so the response shape stays consistent.
 */
const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFound;
