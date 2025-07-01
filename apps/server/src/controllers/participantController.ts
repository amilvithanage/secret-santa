import { Request, Response } from 'express';
import { ParticipantService } from '../services/participantService';
import { CreateParticipantRequest, UpdateParticipantRequest, ApiResponse } from '@secret-santa/shared-types';

export class ParticipantController {
  private participantService = new ParticipantService();

  createParticipant = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: CreateParticipantRequest = req.body;
      const participant = await this.participantService.createParticipant(data);
      
      res.status(201).json({
        success: true,
        data: participant,
        message: 'Participant created successfully',
      } as ApiResponse);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create participant',
      } as ApiResponse);
    }
  };

  getAllParticipants = async (req: Request, res: Response): Promise<void> => {
    try {
      const participants = await this.participantService.getAllParticipants();
      
      res.json({
        success: true,
        data: participants,
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch participants',
      } as ApiResponse);
    }
  };

  getParticipantById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const participant = await this.participantService.getParticipantById(id);
      
      if (!participant) {
        res.status(404).json({
          success: false,
          error: 'Participant not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: participant,
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch participant',
      } as ApiResponse);
    }
  };

  updateParticipant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateParticipantRequest = req.body;
      const participant = await this.participantService.updateParticipant(id, data);
      
      res.json({
        success: true,
        data: participant,
        message: 'Participant updated successfully',
      } as ApiResponse);
    } catch (error: any) {
      const statusCode = error.message === 'Participant not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update participant',
      } as ApiResponse);
    }
  };

  deleteParticipant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.participantService.deleteParticipant(id);
      
      res.json({
        success: true,
        message: 'Participant deleted successfully',
      } as ApiResponse);
    } catch (error: any) {
      const statusCode = error.message === 'Participant not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete participant',
      } as ApiResponse);
    }
  };
}
