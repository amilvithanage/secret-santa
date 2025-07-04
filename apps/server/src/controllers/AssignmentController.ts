import { Request, Response, NextFunction } from "express";
import { AssignmentService } from "../services/AssignmentService";
import { ApiResponse } from "@secret-santa/shared-types";

export class AssignmentController {
  private assignmentService: AssignmentService;

  constructor() {
    this.assignmentService = new AssignmentService();
  }

  /**
   * Get all assignments
   * GET /api/v1/assignments
   */
  getAllAssignments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const assignments = await this.assignmentService.getAllAssignments();

      const response: ApiResponse = {
        success: true,
        data: assignments,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get assignment by ID
   * GET /api/v1/assignments/:id
   */
  getAssignmentById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const assignment = await this.assignmentService.getAssignmentById(id);

      if (!assignment) {
        const response: ApiResponse = {
          success: false,
          error: "Assignment not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: assignment,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  /**
   * Generate assignments for a gift exchange
   * POST /api/v1/gift-exchanges/:giftExchangeId/assignments
   */
  createAssignments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.assignmentService.createAssignments({
        giftExchangeId: id,
      });

      if (result.success) {
        const response: ApiResponse = {
          success: true,
          data: result.assignments,
          message: "Secret Santa assignments generated successfully",
        };
        res.status(201).json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: result.error,
        };
        res.status(422).json(response);
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get assignments for a gift exchange
   * GET /api/v1/gift-exchanges/:giftExchangeId/assignments
   */
  getAssignmentsForExchange = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { giftExchangeId } = req.params;
      const assignments =
        await this.assignmentService.getAssignmentsByGiftExchange(
          giftExchangeId,
        );

      const response: ApiResponse = {
        success: true,
        data: assignments,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get assignment for a specific participant
   * GET /api/v1/gift-exchanges/:giftExchangeId/assignments/:participantId
   */
  getAssignmentForParticipant = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { giftExchangeId, participantId } = req.params;
      const assignment =
        await this.assignmentService.getAssignmentForParticipant(
          giftExchangeId,
          participantId,
        );

      const response: ApiResponse = {
        success: true,
        data: assignment,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset assignments for a gift exchange
   * DELETE /api/v1/gift-exchanges/:giftExchangeId/assignments
   */
  resetAssignments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { giftExchangeId } = req.params;
      await this.assignmentService.deleteAssignmentsByGiftExchange(
        giftExchangeId,
      );

      const response: ApiResponse = {
        success: true,
        message: "Assignments reset successfully",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
