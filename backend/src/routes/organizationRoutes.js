import { Router } from 'express';
import authenticateUser from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { USER_ROLES } from '../models/User.js';
import {
  listOrganizations,
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
} from '../controllers/organizationController.js';

const router = Router();

router.use(authenticateUser);

router.get('/', listOrganizations);
router.post(
  '/',
  authorizeRoles(USER_ROLES.PLATFORM_ADMIN, USER_ROLES.BUSINESS_OWNER),
  createOrganization
);
router.get('/:id', getOrganization);
router.patch(
  '/:id',
  authorizeRoles(USER_ROLES.PLATFORM_ADMIN, USER_ROLES.BUSINESS_OWNER),
  updateOrganization
);
router.delete(
  '/:id',
  authorizeRoles(USER_ROLES.PLATFORM_ADMIN),
  deleteOrganization
);

export default router;
