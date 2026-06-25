import { Router } from 'express';
import authenticateUser from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { USER_ROLES } from '../models/User.js';
import {
  listSubscriptions,
  getSubscription,
  patchSubscription,
} from '../controllers/subscriptionController.js';

const router = Router();

// Platform admin only. Owner-side billing endpoints will live under
// /api/billing/... in a follow-up release.
router.use(authenticateUser, authorizeRoles(USER_ROLES.PLATFORM_ADMIN));

router.get('/',         listSubscriptions);
router.get('/:orgId',   getSubscription);
router.patch('/:orgId', patchSubscription);

export default router;
