import { Router } from 'express';
import { AssignmentController } from '../controllers/assignmentController';

/**
 * Assignment Routes - API endpoint definitions for assignment management
 * Includes Secret Santa assignment algorithm endpoints
 */
const router = Router();
const assignmentController = new AssignmentController();

// GET /api/assignments - Get all assignments
router.get('/', assignmentController.getAllAssignments);

// GET /api/assignments/:id - Get assignment by ID
router.get('/:id', assignmentController.getAssignmentById);

// Assignment management within gift exchanges

// POST /api/gift-exchanges/:id/assign - Create Secret Santa assignments
router.post('/:id/assign', assignmentController.createAssignments);

// GET /api/gift-exchanges/:id/assignments - Get assignments for exchange
router.get('/:id/assignments', assignmentController.getAssignmentsByGiftExchange);

// DELETE /api/gift-exchanges/:id/assignments - Delete all assignments for exchange
router.delete('/:id/assignments', assignmentController.deleteAssignmentsByGiftExchange);

export default router;
