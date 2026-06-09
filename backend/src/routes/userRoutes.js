// ============================================================================
//  userRoutes — admin-only cross-tenant user management
// ----------------------------------------------------------------------------
//  Mounted at /api/users from routes/index.js. Every endpoint here requires
//  role=platform_admin; org-scoped user management lives in the invite flow
//  (see inviteRoutes / inviteController).
// ============================================================================

import { Router } from 'express';
import authenticateUser from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { USER_ROLES } from '../models/User.js';
import { listUsers, updateUser } from '../controllers/userController.js';

const router = Router();

router.use(authenticateUser);
router.use(authorizeRoles(USER_ROLES.PLATFORM_ADMIN));

router.get('/', listUsers);
router.patch('/:id', updateUser);

export default router;
