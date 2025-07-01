import { Router } from 'express';
import { ParticipantController } from '../controllers/participantController';
import { validateRequest, participantValidationRules } from '../middleware/validation';

const router = Router();
const participantController = new ParticipantController();

// GET /api/participants - Get all participants
router.get('/', participantController.getAllParticipants);

// GET /api/participants/:id - Get participant by ID
router.get('/:id', participantController.getParticipantById);

// POST /api/participants - Create new participant
router.post(
  '/',
  validateRequest(participantValidationRules.create),
  participantController.createParticipant
);

// PUT /api/participants/:id - Update participant
router.put(
  '/:id',
  validateRequest(participantValidationRules.update),
  participantController.updateParticipant
);

// DELETE /api/participants/:id - Delete participant
router.delete('/:id', participantController.deleteParticipant);

export default router;
