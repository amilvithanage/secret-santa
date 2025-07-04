import { Router } from "express";
import { GiftExchangeController } from "../../controllers/giftExchangeController";
import { validate } from "../../middleware/validation";
import {
  createGiftExchangeSchema,
  updateGiftExchangeSchema,
  giftExchangeParamsSchema,
  giftExchangeWithParticipantParamsSchema,
  addParticipantToExchangeSchema,
  getGiftExchangesQuerySchema,
} from "../../validation/giftExchange";

const router = Router();
const giftExchangeController = new GiftExchangeController();

// GET /api/v1/gift-exchanges
router.get(
  "/",
  validate(getGiftExchangesQuerySchema),
  giftExchangeController.getGiftExchanges,
);

// POST /api/v1/gift-exchanges
router.post(
  "/",
  validate(createGiftExchangeSchema),
  giftExchangeController.createGiftExchange,
);

// GET /api/v1/gift-exchanges/:id
router.get(
  "/:id",
  validate(giftExchangeParamsSchema),
  giftExchangeController.getGiftExchangeById,
);

// PUT /api/v1/gift-exchanges/:id
router.put(
  "/:id",
  validate(giftExchangeParamsSchema.merge(updateGiftExchangeSchema)),
  giftExchangeController.updateGiftExchange,
);

// DELETE /api/v1/gift-exchanges/:id
router.delete(
  "/:id",
  validate(giftExchangeParamsSchema),
  giftExchangeController.deleteGiftExchange,
);

// GET /api/v1/gift-exchanges/:id/participants
router.get(
  "/:id/participants",
  validate(giftExchangeParamsSchema),
  giftExchangeController.getExchangeParticipants,
);

// POST /api/v1/gift-exchanges/:id/participants
router.post(
  "/:id/participants",
  validate(giftExchangeParamsSchema.merge(addParticipantToExchangeSchema)),
  giftExchangeController.addParticipantToExchange,
);

// DELETE /api/v1/gift-exchanges/:id/participants/:participantId
router.delete(
  "/:id/participants/:participantId",
  validate(giftExchangeWithParticipantParamsSchema),
  giftExchangeController.removeParticipantFromExchange,
);

export default router;
