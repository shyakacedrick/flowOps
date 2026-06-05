/**
 * Standardized API response helpers. Every successful response goes
 * through `success()` and every error through the global error handler,
 * so clients can rely on a stable envelope shape.
 */

export const success = (res, data = null, statusCode = 200, meta = undefined) => {
  const payload = { success: true, data };
  if (meta !== undefined) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

export const created = (res, data = null, meta = undefined) =>
  success(res, data, 201, meta);

export const noContent = (res) => res.status(204).send();

export const error = (res, message = 'Internal Server Error', statusCode = 500, details) => {
  const payload = { success: false, message };
  if (details !== undefined) payload.details = details;
  return res.status(statusCode).json(payload);
};

export default { success, created, noContent, error };
