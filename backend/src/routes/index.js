import { Router } from 'express';
import authRoutes from './authRoutes.js';
import organizationRoutes from './organizationRoutes.js';
import queueRoutes from './queueRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import activityRoutes from './activityRoutes.js';
import inviteRoutes from './inviteRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import publicRoutes from './publicRoutes.js';
import userRoutes from './userRoutes.js';
import eventsRoutes from './eventsRoutes.js';
import platformSettingsRoutes from './platformSettingsRoutes.js';
import featureFlagRoutes from './featureFlagRoutes.js';
import notificationRuleRoutes from './notificationRuleRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';

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
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes);
router.use('/events', eventsRoutes);
// Admin-only configuration endpoints. Authorization is enforced inside
// each router so we can mount them under the same /admin namespace.
router.use('/admin/settings', platformSettingsRoutes);
router.use('/admin/feature-flags', featureFlagRoutes);
router.use('/admin/notification-rules', notificationRuleRoutes);
router.use('/admin/subscriptions', subscriptionRoutes);
router.use('/public', publicRoutes);

export default router;
