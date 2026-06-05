import ApiError from '../utils/ApiError.js';

/**
 * Restricts a route to one or more roles.
 *
 *   router.post('/', authenticateUser, authorizeRoles('platform_admin'), handler);
 *   router.post('/', authenticateUser, authorizeRoles('business_owner', 'staff'), handler);
 */
export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  if (roles.length > 0 && !roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  return next();
};

export default authorizeRoles;
