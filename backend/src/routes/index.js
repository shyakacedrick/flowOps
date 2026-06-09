import { Router } from 'express';
import authRoutes from './authRoutes.js';
import organizationRoutes from './organizationRoutes.js';
import queueRoutes from './queueRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import activityRoutes from './activityRoutes.js';
import inviteRoutes from './inviteRoutes.js';
import publicRoutes from './publicRoutes.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'FlowOps API',
      version: '1.0.0',
      status: 'ok',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/queues', queueRoutes);
router.use('/tickets', ticketRoutes);
router.use('/activities', activityRoutes);
router.use('/invites', inviteRoutes);
router.use('/public', publicRoutes);

export default router;
