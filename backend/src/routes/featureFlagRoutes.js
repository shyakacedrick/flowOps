import { Router } from 'express';
import authenticateUser from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { USER_ROLES } from '../models/User.js';
import {
  listFlags,
  createFlag,
  updateFlag,
  deleteFlag,
} from '../controllers/featureFlagController.js';

const router = Router();

router.use(authenticateUser, authorizeRoles(USER_ROLES.PLATFORM_ADMIN));

router.get('/', listFlags);
router.post('/', createFlag);
router.patch('/:key', updateFlag);
router.delete('/:key', deleteFlag);

export default router;
