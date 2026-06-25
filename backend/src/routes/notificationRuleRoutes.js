import { Router } from 'express';
import authenticateUser from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { USER_ROLES } from '../models/User.js';
import {
  listRules,
  createRule,
  updateRule,
  deleteRule,
} from '../controllers/notificationRuleController.js';

const router = Router();

// Every endpoint requires platform_admin — there is no per-tenant
// notification-rule scope (yet); rules are platform-wide policy.
router.use(authenticateUser, authorizeRoles(USER_ROLES.PLATFORM_ADMIN));

router.get('/', listRules);
router.post('/', createRule);
router.patch('/:key', updateRule);
router.delete('/:key', deleteRule);

export default router;
