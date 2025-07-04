import { Router } from "express";
import { AssignmentController } from "../../controllers/AssignmentController";

/**
 * Assignment Routes - API endpoint definitions for assignment management
 * Includes Secret Santa assignment algorithm endpoints
 */
const router = Router();
const assignmentController = new AssignmentController();

// GET /api/assignments - Get all assignments
router.get("/", assignmentController.getAllAssignments);

// GET /api/assignments/:id - Get assignment by ID
router.get("/:id", assignmentController.getAssignmentById);

export default router;
