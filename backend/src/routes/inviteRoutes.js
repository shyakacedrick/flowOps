import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  createInvite,
  listInvites,
  revokeInvite,
} from '../controllers/inviteController.js';

const router = Router();

router.use(authenticateUser);

router.get('/', listInvites);
router.post('/', createInvite);
router.delete('/:id', revokeInvite);

export default router;
