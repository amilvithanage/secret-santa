import { Request, Response, NextFunction } from "express";
import { ParticipantService } from "../services/ParticipantService";
import {
  CreateParticipantRequest,
  UpdateParticipantRequest,
} from "@secret-santa/shared-types";
import { NotFoundError } from "../utils/errors";
import { ResponseHelper } from "../utils/responseHelper";

export class ParticipantController {
  constructor(private participantService = new ParticipantService()) {}

  createParticipant = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
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

  getAllParticipants = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
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

  getParticipantById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const participant = await this.participantService.getParticipantById(id);
      if (!participant) throw new NotFoundError("Participant not found");
      ResponseHelper.success(res, participant);
    } catch (error) {
      next(error);
    }
  };

  updateParticipant = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
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

  deleteParticipant = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      await this.participantService.deleteParticipant(id);
      ResponseHelper.success(res, null, "Participant deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}
