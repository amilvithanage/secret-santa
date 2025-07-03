import { Router } from 'express';
import participantRoutes from './participantRoutes'
import giftExchangeRoutes from './giftExchangeRoutes'

const router = Router()

// Mount route modules
router.use('/participants', participantRoutes)
router.use('/gift-exchanges', giftExchangeRoutes)

// Future routes will be added here:
// router.use('/assignments', assignmentRoutes);
// router.use('/exclusion-rules', exclusionRuleRoutes);

export default router
