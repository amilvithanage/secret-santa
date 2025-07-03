import { Router } from 'express';
import { GiftExchangeController } from '../controllers/giftExchangeController';
import {
  validateRequest,
  giftExchangeValidationSchemas,
  addParticipantValidationSchema
} from '../middleware/validation';

/**
 * Gift Exchange Routes - API endpoint definitions for gift exchange management
 * Includes validation middleware for request validation
 */
const router = Router();
const giftExchangeController = new GiftExchangeController();

// GET /api/gift-exchanges - Get all gift exchanges
router.get('/', giftExchangeController.getAllGiftExchanges);

// GET /api/gift-exchanges/:id - Get gift exchange by ID
router.get('/:id', giftExchangeController.getGiftExchangeById);

// POST /api/gift-exchanges - Create new gift exchange
router.post(
  '/',
  validateRequest(giftExchangeValidationSchemas.create),
  giftExchangeController.createGiftExchange
);

// PUT /api/gift-exchanges/:id - Update gift exchange
router.put(
  '/:id',
  validateRequest(giftExchangeValidationSchemas.update),
  giftExchangeController.updateGiftExchange
);

// DELETE /api/gift-exchanges/:id - Delete gift exchange
router.delete('/:id', giftExchangeController.deleteGiftExchange);

// Participant management within gift exchanges

// GET /api/gift-exchanges/:id/participants - Get participants for exchange
router.get('/:id/participants', giftExchangeController.getExchangeParticipants);

// POST /api/gift-exchanges/:id/participants - Add participant to exchange
router.post(
  '/:id/participants',
  validateRequest(addParticipantValidationSchema),
  giftExchangeController.addParticipantToExchange
);

// DELETE /api/gift-exchanges/:id/participants/:participantId - Remove participant from exchange
router.delete('/:id/participants/:participantId', giftExchangeController.removeParticipantFromExchange);

export default router;
