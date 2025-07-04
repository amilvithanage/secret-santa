import { Router } from "express";
import { GiftExchangeController } from "../../controllers/giftExchangeController";
import { AssignmentController } from "../../controllers/AssignmentController";
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
const assignmentController = new AssignmentController();

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

// Assignment routes for gift exchanges
// POST /api/v1/gift-exchanges/:id/assignments - Create Secret Santa assignments
router.post(
  "/:id/assignments",
  validate(giftExchangeParamsSchema),
  assignmentController.createAssignments,
);

// GET /api/v1/gift-exchanges/:id/assignments - Get assignments for exchange
router.get(
  "/:id/assignments",
  validate(giftExchangeParamsSchema),
  assignmentController.getAssignmentsForExchange,
);

// DELETE /api/v1/gift-exchanges/:id/assignments - Delete all assignments for exchange
router.delete(
  "/:id/assignments",
  validate(giftExchangeParamsSchema),
  assignmentController.resetAssignments,
);

export default router;
