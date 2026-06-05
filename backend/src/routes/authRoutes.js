import { Router } from 'express';
import authenticateUser from '../middleware/auth.js';
import { register, login, me } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateUser, me);

export default router;
