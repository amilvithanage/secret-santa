import { Router } from 'express';
import { ParticipantController } from '../controllers/participantController';
import { validateRequest, participantValidationSchemas } from '../middleware/validation';

const router = Router();
const participantController = new ParticipantController();

router.get('/', participantController.getAllParticipants);
router.get('/:id', participantController.getParticipantById);
router.post(
  '/',
  validateRequest(participantValidationSchemas.create),
  participantController.createParticipant
);
router.put(
  '/:id',
  validateRequest(participantValidationSchemas.update),
  participantController.updateParticipant
);
router.delete('/:id', participantController.deleteParticipant);

export default router;