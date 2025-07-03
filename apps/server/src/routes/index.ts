import { Router } from 'express';
import participantRoutes from './participantRoutes';
import giftExchangeRoutes from './giftExchangeRoutes';
import assignmentRoutes from './assignmentRoutes';

const router = Router()

// Mount route modules
router.use('/participants', participantRoutes);
router.use('/gift-exchanges', giftExchangeRoutes);
router.use('/assignments', assignmentRoutes);

// Future routes will be added here:
// router.use('/exclusion-rules', exclusionRuleRoutes);

export default router
