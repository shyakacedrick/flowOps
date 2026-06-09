import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { getSummary } from '../controllers/analyticsController.js';

const router = Router();

router.use(authenticateUser);

router.get('/summary', getSummary);

export default router;
