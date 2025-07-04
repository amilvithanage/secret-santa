import { Request, Response, NextFunction } from "express";
import { ParticipantService } from "../services/ParticipantService";
import {
  ApiResponse,
  CreateParticipantRequest,
  UpdateParticipantRequest,
} from "@secret-santa/shared-types";
import { ResponseHelper } from "../utils/ResponseHelper";
import { NotFoundError } from "../utils/errors";

export class ParticipantController {
  constructor(private participantService = new ParticipantService()) {}

  /**
   * Create a new participant
   * POST /api/v1/participants
   */
  createParticipant = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data: CreateParticipantRequest = req.body;
      const participant = await this.participantService.createParticipant(data);
      ResponseHelper.created(
        res,
        participant,
        "Participant created successfully",
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all participants
   * GET /api/v1/participants
   */
  getParticipants = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 10;
      const search = req.query.search as string;

      let participants;
      if (search) {
        participants = await this.participantService.searchParticipants(
          search,
          page,
          limit,
        );
      } else {
        participants = await this.participantService.getParticipants(
          page,
          limit,
        );
      }
      ResponseHelper.success(res, participants);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get participant by ID
   * GET /api/v1/participants/:id
   */
  getParticipantById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const participant = await this.participantService.getParticipantById(id);
      if (!participant) throw new NotFoundError("Participant not found");
      ResponseHelper.success(res, participant);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update participant
   * PUT /api/v1/participants/:id
   */
  updateParticipant = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateParticipantRequest = req.body;
      const participant = await this.participantService.updateParticipant(
        id,
        data,
      );
      ResponseHelper.success(
        res,
        participant,
        "Participant updated successfully",
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete participant
   * DELETE /api/v1/participants/:id
   */
  deleteParticipant = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.participantService.deleteParticipant(id);
      ResponseHelper.success(res, null, "Participant deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}
