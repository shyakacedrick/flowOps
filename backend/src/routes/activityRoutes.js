import { Router } from 'express';
import authenticateUser from '../middleware/auth.js';
import { listActivities } from '../controllers/activityController.js';

const router = Router();

router.use(authenticateUser);
router.get('/', listActivities);

export default router;
