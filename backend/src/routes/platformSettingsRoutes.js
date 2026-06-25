import { Router } from 'express';
import authenticateUser from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { USER_ROLES } from '../models/User.js';
import {
  getSettings,
  updateSettings,
} from '../controllers/platformSettingsController.js';

const router = Router();

// Every endpoint here is platform-admin only. Owners and staff have no
// reason to read or write platform-wide configuration.
router.use(authenticateUser, authorizeRoles(USER_ROLES.PLATFORM_ADMIN));

router.get('/', getSettings);
router.patch('/', updateSettings);

export default router;
