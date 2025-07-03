import { NextFunction, Request, Response } from 'express';
import { GiftExchangeService } from '../services/giftExchangeService';
import { 
  CreateGiftExchangeRequest, 
  UpdateGiftExchangeRequest, 
  AddParticipantToExchangeRequest,
  ApiResponse 
} from '@secret-santa/shared-types';
import { ResponseHelper } from '../utils/responseHelper';
import { NotFoundError } from '../utils/errors';

/**
 * Gift Exchange Controller - HTTP request/response handling for gift exchanges
 * Handles API endpoints and delegates business logic to GiftExchangeService
 */
export class GiftExchangeController {
  private giftExchangeService = new GiftExchangeService();

  /**
   * Create a new gift exchange
   * POST /api/gift-exchanges
   */
  createGiftExchange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateGiftExchangeRequest = req.body;
      const giftExchange = await this.giftExchangeService.createGiftExchange(data);
      ResponseHelper.created(res, giftExchange, 'Gift exchange created successfully');
    }  catch (error) {
      next(error);
    }
  };

  /**
   * Get all gift exchanges
   * GET /api/gift-exchanges
   */
  getAllGiftExchanges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const giftExchanges = await this.giftExchangeService.getAllGiftExchanges();
      ResponseHelper.success(res, giftExchanges);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get gift exchange by ID
   * GET /api/gift-exchanges/:id
   */
  getGiftExchangeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const giftExchange = await this.giftExchangeService.getGiftExchangeById(id);
      if (!giftExchange) throw new NotFoundError('Participant not found');
            ResponseHelper.success(res, giftExchange);
          } catch (error) {
            next(error);
          }
  };

  /**
   * Update gift exchange
   * PUT /api/gift-exchanges/:id
   */
  updateGiftExchange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateGiftExchangeRequest = req.body;
      const giftExchange = await this.giftExchangeService.updateGiftExchange(id, data);
      ResponseHelper.success(res, giftExchange, 'Gift exchange updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete gift exchange
   * DELETE /api/gift-exchanges/:id
   */
  deleteGiftExchange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.giftExchangeService.deleteGiftExchange(id);
      ResponseHelper.success(res, null, 'Gift exchange deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add participant to gift exchange
   * POST /api/gift-exchanges/:id/participants
   */
  addParticipantToExchange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: AddParticipantToExchangeRequest = req.body;
      const giftExchange = await this.giftExchangeService.addParticipantToExchange(id, data);
      ResponseHelper.created(res, giftExchange, 'Participant added to gift exchange successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove participant from gift exchange
   * DELETE /api/gift-exchanges/:id/participants/:participantId
   */
  removeParticipantFromExchange = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, participantId } = req.params;
      const giftExchange = await this.giftExchangeService.removeParticipantFromExchange(id, participantId);
      
      res.json({
        success: true,
        data: giftExchange,
        message: 'Participant removed from gift exchange successfully',
      } as ApiResponse);
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to remove participant from gift exchange',
      } as ApiResponse);
    }
  };

  /**
   * Get participants for a gift exchange
   * GET /api/gift-exchanges/:id/participants
   */
  getExchangeParticipants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const participants = await this.giftExchangeService.getExchangeParticipants(id);
      ResponseHelper.success(res, participants);
    } catch (error) {
      next(error);
    }
  };
}
function next(error: unknown) {
  throw new Error('Function not implemented.');
}

