import { Router } from "express";
import { ParticipantController } from "../../controllers/ParticipantController";
import { validate } from "../../middleware/validation";
import {
  createParticipantSchema,
  updateParticipantSchema,
  participantParamsSchema,
  getParticipantsQuerySchema,
} from "../../validation/participant";

const router = Router();
const participantController = new ParticipantController();

// GET /api/v1/participants
router.get(
  "/",
  validate(getParticipantsQuerySchema),
  participantController.getAllParticipants,
);

// POST /api/v1/participants
router.post(
  "/",
  validate(createParticipantSchema),
  participantController.createParticipant,
);

// GET /api/v1/participants/:id
router.get(
  "/:id",
  validate(participantParamsSchema),
  participantController.getParticipantById,
);

// PUT /api/v1/participants/:id
router.put(
  "/:id",
  validate(participantParamsSchema.merge(updateParticipantSchema)),
  participantController.updateParticipant,
);

// DELETE /api/v1/participants/:id
router.delete(
  "/:id",
  validate(participantParamsSchema),
  participantController.deleteParticipant,
);

export default router;
