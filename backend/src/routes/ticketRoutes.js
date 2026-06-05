import { Router } from 'express';
import authenticateUser from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { USER_ROLES } from '../models/User.js';
import {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
} from '../controllers/ticketController.js';

const router = Router();

router.use(authenticateUser);

// All authenticated roles can manage tickets within their org.
router.post('/', createTicket);
router.get('/', listTickets);
router.get('/:id', getTicket);
router.patch('/:id', updateTicket);

// Hard-delete restricted to admins/owners; staff use status changes instead.
router.delete(
  '/:id',
  authorizeRoles(USER_ROLES.PLATFORM_ADMIN, USER_ROLES.BUSINESS_OWNER),
  deleteTicket
);

export default router;
