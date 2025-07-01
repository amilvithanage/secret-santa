import { Router } from 'express';
import participantRoutes from './participantRoutes';

const router = Router();

// Mount route modules
router.use('/participants', participantRoutes);

export default router;
