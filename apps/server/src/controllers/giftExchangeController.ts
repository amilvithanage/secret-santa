import { Request, Response, NextFunction } from "express";
import { GiftExchangeService } from "../services/giftExchangeService";
import {
  ApiResponse,
  CreateGiftExchangeRequest,
} from "@secret-santa/shared-types";
import { ResponseHelper } from "../utils/ResponseHelper";

export class GiftExchangeController {
  private giftExchangeService: GiftExchangeService;

  constructor() {
    this.giftExchangeService = new GiftExchangeService();
  }

  /**
   * Create a new gift exchange
   * POST /api/v1/gift-exchanges
   */
  createGiftExchange = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data: CreateGiftExchangeRequest = req.body;
      const giftExchange =
        await this.giftExchangeService.createGiftExchange(data);
      ResponseHelper.created(
        res,
        giftExchange,
        "Gift exchange created successfully",
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all gift exchanges
   * GET /api/v1/gift-exchanges
   */
  getGiftExchanges = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 10;
      const includeParticipants = req.query.includeParticipants === "true";

      const result = await this.giftExchangeService.getGiftExchanges(
        page,
        limit,
        includeParticipants,
      );
      ResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get gift exchange by ID
   * GET /api/v1/gift-exchanges/:id
   */
  getGiftExchangeById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const includeParticipants = req.query.includeParticipants === "true";
      const includeAssignments = req.query.includeAssignments === "true";

      const giftExchange = await this.giftExchangeService.getGiftExchangeById(
        id,
        includeParticipants,
        includeAssignments,
      );

      ResponseHelper.success(res, giftExchange);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update gift exchange
   * PUT /api/v1/gift-exchanges/:id
   */
  updateGiftExchange = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const giftExchange = await this.giftExchangeService.updateGiftExchange(
        id,
        req.body,
      );

      ResponseHelper.success(
        res,
        giftExchange,
        "Gift exchange updated successfully",
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete gift exchange
   * DELETE /api/v1/gift-exchanges/:id
   */
  deleteGiftExchange = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.giftExchangeService.deleteGiftExchange(id);

      ResponseHelper.success(res, null, "Gift exchange deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add participant to gift exchange
   * POST /api/v1/gift-exchanges/:id/participants
   */
  addParticipantToExchange = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.giftExchangeService.addParticipantToExchange(id, req.body);

      const response: ApiResponse = {
        success: true,
        message: "Participant added to gift exchange successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove participant from gift exchange
   * DELETE /api/v1/gift-exchanges/:id/participants/:participantId
   */
  removeParticipantFromExchange = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id, participantId } = req.params;
      await this.giftExchangeService.removeParticipantFromExchange(
        id,
        participantId,
      );

      ResponseHelper.success(
        res,
        null,
        "Participant removed from gift exchange successfully",
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get participants in gift exchange
   * GET /api/v1/gift-exchanges/:id/participants
   */
  getExchangeParticipants = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const participants =
        await this.giftExchangeService.getExchangeParticipants(id);

      ResponseHelper.success(res, participants);
    } catch (error) {
      next(error);
    }
  };
}
