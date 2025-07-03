import { NextFunction, Request, Response } from "express";
import { AssignmentService } from "../services/assignmentService";
import {
  CreateAssignmentsRequest,
} from "@secret-santa/shared-types";
import { ResponseHelper } from "../utils/responseHelper";
import { InternalServerError, NotFoundError } from "../utils/errors";

/**
 * Assignment Controller - HTTP request/response handling for assignments
 * Handles API endpoints and delegates business logic to AssignmentService
 */
export class AssignmentController {
  private assignmentService = new AssignmentService();

  /**
   * Create Secret Santa assignments for a gift exchange
   * POST /api/gift-exchanges/:id/assign
   */
  createAssignments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: CreateAssignmentsRequest = { giftExchangeId: id };
      const result = await this.assignmentService.createAssignments(data);
      if (result.success) {
        ResponseHelper.created(
          res,
          result.assignments,
          "Secret Santa assignments created successfully"
        );
      } else {
        throw new InternalServerError("Assignments not created");
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all assignments
   * GET /api/assignments
   */
  getAllAssignments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const assignments = await this.assignmentService.getAllAssignments();
      ResponseHelper.success(res, assignments);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get assignment by ID
   * GET /api/assignments/:id
   */
  getAssignmentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const assignment = await this.assignmentService.getAssignmentById(id);
      if (!assignment) throw new NotFoundError('Assignment not found');
      ResponseHelper.success(res, assignment);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get assignments for a gift exchange
   * GET /api/gift-exchanges/:id/assignments
   */
  getAssignmentsByGiftExchange = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const assignments =
        await this.assignmentService.getAssignmentsByGiftExchange(id);
      ResponseHelper.success(res, assignments);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete all assignments for a gift exchange
   * DELETE /api/gift-exchanges/:id/assignments
   */
  deleteAssignmentsByGiftExchange = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.assignmentService.deleteAssignmentsByGiftExchange(id);
      ResponseHelper.success(res, null, 'All assignments deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
