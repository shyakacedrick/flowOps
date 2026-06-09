import { Router } from 'express';
import authenticateUser from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { USER_ROLES } from '../models/User.js';
import {
  listQueues,
  createQueue,
  getQueue,
  updateQueue,
  deleteQueue,
  restoreQueue,
} from '../controllers/queueController.js';

const router = Router();

router.use(authenticateUser);

// Read endpoints — any authenticated user (scoped to their org).
router.get('/', listQueues);
router.get('/:id', getQueue);

// Write endpoints — platform_admin or business_owner.
router.post(
  '/',
  authorizeRoles(USER_ROLES.PLATFORM_ADMIN, USER_ROLES.BUSINESS_OWNER),
  createQueue
);
router.patch(
  '/:id',
  authorizeRoles(USER_ROLES.PLATFORM_ADMIN, USER_ROLES.BUSINESS_OWNER),
  updateQueue
);
router.delete(
  '/:id',
  authorizeRoles(USER_ROLES.PLATFORM_ADMIN, USER_ROLES.BUSINESS_OWNER),
  deleteQueue
);

// Soft-delete restore — platform admin only.
router.post(
  '/:id/restore',
  authorizeRoles(USER_ROLES.PLATFORM_ADMIN),
  restoreQueue
);

export default router;
