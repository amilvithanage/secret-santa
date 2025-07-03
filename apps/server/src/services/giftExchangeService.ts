import { GiftExchange } from '../generated/prisma';
import {
  CreateGiftExchangeRequest,
  UpdateGiftExchangeRequest,
  GiftExchangeResponse,
  AddParticipantToExchangeRequest,
  GiftExchangeStatus
} from '@secret-santa/shared-types';
import DatabaseService from './database';
import { BadRequestError, NotFoundError, ValidationError } from '../utils/errors';

/**
 * Gift Exchange Service - Business logic for gift exchange management
 * Handles CRUD operations for gift exchanges with proper error handling
 */
export class GiftExchangeService {
  private db = DatabaseService.getInstance().prisma;

  /**
   * Create a new gift exchange
   */
  async createGiftExchange(data: CreateGiftExchangeRequest): Promise<GiftExchangeResponse> {
    try {
      const giftExchange = await this.db.giftExchange.create({
        data: {
          name: data.name,
          year: data.year,
          status: GiftExchangeStatus.DRAFT,
        },
        include: {
          participants: {
            include: {
              participant: true,
            },
          },
          assignments: {
            include: {
              giver: true,
              receiver: true,
            },
          },
        },
      });

      return this.mapToResponse(giftExchange);
    } catch (error: unknown) {
      // Handle specific Prisma errors if needed
      throw error;
    }
  }

  /**
   * Get all gift exchanges
   */
  async getAllGiftExchanges(): Promise<GiftExchangeResponse[]> {
    const giftExchanges = await this.db.giftExchange.findMany({
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
        assignments: {
          include: {
            giver: true,
            receiver: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return giftExchanges.map(this.mapToResponse);
  }

  /**
   * Get gift exchange by ID
   */
  async getGiftExchangeById(id: string): Promise<GiftExchangeResponse | null> {
    const giftExchange = await this.db.giftExchange.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
        assignments: {
          include: {
            giver: true,
            receiver: true,
          },
        },
      },
    });

    return giftExchange ? this.mapToResponse(giftExchange) : null;
  }

  /**
   * Update gift exchange
   */
  async updateGiftExchange(id: string, data: UpdateGiftExchangeRequest): Promise<GiftExchangeResponse> {
    try {
      const giftExchange = await this.db.giftExchange.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.year && { year: data.year }),
          ...(data.status && { status: data.status }),
        },
        include: {
          participants: {
            include: {
              participant: true,
            },
          },
          assignments: {
            include: {
              giver: true,
              receiver: true,
            },
          },
        },
      });

      return this.mapToResponse(giftExchange);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Gift exchange not found');
      }
      throw error;
    }
  }

  /**
   * Delete gift exchange
   */
  async deleteGiftExchange(id: string): Promise<void> {
    try {
      await this.db.giftExchange.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Gift exchange not found');
      }
      throw error;
    }
  }

  /**
   * Add participant to gift exchange
   */
  async addParticipantToExchange(
    exchangeId: string, 
    data: AddParticipantToExchangeRequest
  ): Promise<GiftExchangeResponse> {
    try {
      // Check if participant exists
      const participant = await this.db.participant.findUnique({
        where: { id: data.participantId },
      });

      if (!participant) {
        throw new NotFoundError('Participant not found');
      }

      // Check if gift exchange exists
      const giftExchange = await this.db.giftExchange.findUnique({
        where: { id: exchangeId },
      });

      if (!giftExchange) {
        throw new NotFoundError('Gift exchange not found');
      }

      // Check if participant is already in the exchange
      const existingParticipant = await this.db.giftExchangeParticipant.findUnique({
        where: {
          giftExchangeId_participantId: {
            giftExchangeId: exchangeId,
            participantId: data.participantId,
          },
        },
      });

      if (existingParticipant) {
        throw new BadRequestError('Participant is already in this gift exchange');
      }

      // Add participant to exchange
      await this.db.giftExchangeParticipant.create({
        data: {
          giftExchangeId: exchangeId,
          participantId: data.participantId,
        },
      });

      // Update exchange status if it's still in DRAFT
      if (giftExchange.status === GiftExchangeStatus.DRAFT) {
        await this.db.giftExchange.update({
          where: { id: exchangeId },
          data: { status: GiftExchangeStatus.PARTICIPANTS_ADDED },
        });
      }

      // Return updated gift exchange
      return this.getGiftExchangeById(exchangeId) as Promise<GiftExchangeResponse>;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Remove participant from gift exchange
   */
  async removeParticipantFromExchange(exchangeId: string, participantId: string): Promise<GiftExchangeResponse> {
    try {
      // Check if the participant is in the exchange
      const existingParticipant = await this.db.giftExchangeParticipant.findUnique({
        where: {
          giftExchangeId_participantId: {
            giftExchangeId: exchangeId,
            participantId: participantId,
          },
        },
      });

      if (!existingParticipant) {
        throw new ValidationError('Participant is not in this gift exchange');
      }

      // Remove participant from exchange
      await this.db.giftExchangeParticipant.delete({
        where: {
          giftExchangeId_participantId: {
            giftExchangeId: exchangeId,
            participantId: participantId,
          },
        },
      });

      // Check if this was the last participant and update status if needed
      const remainingParticipants = await this.db.giftExchangeParticipant.count({
        where: { giftExchangeId: exchangeId },
      });

      if (remainingParticipants === 0) {
        await this.db.giftExchange.update({
          where: { id: exchangeId },
          data: { status: GiftExchangeStatus.DRAFT },
        });
      }

      // Return updated gift exchange
      return this.getGiftExchangeById(exchangeId) as Promise<GiftExchangeResponse>;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Gift exchange not found');
      }
      throw error;
    }
  }

  /**
   * Get gift exchange by name and year (similar to getParticipantByEmail)
   */
  async getGiftExchangeByNameAndYear(name: string, year: number): Promise<GiftExchangeResponse | null> {
    const giftExchange = await this.db.giftExchange.findFirst({
      where: {
        name: name,
        year: year
      },
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
        assignments: {
          include: {
            giver: true,
            receiver: true,
          },
        },
      },
    });

    return giftExchange ? this.mapToResponse(giftExchange) : null;
  }

  /**
   * Get participants for a gift exchange
   */
  async getExchangeParticipants(exchangeId: string) {
    const participants = await this.db.giftExchangeParticipant.findMany({
      where: { giftExchangeId: exchangeId },
      include: {
        participant: true,
      },
    });

    return participants.map((ep: any) => ({
      id: ep.participant.id,
      name: ep.participant.name,
      email: ep.participant.email,
      createdAt: ep.participant.createdAt.toISOString(),
      updatedAt: ep.participant.updatedAt.toISOString(),
      addedToExchangeAt: ep.createdAt.toISOString(),
    }));
  }

  /**
   * Map Prisma gift exchange to API response format
   */
  private mapToResponse(giftExchange: any): GiftExchangeResponse {
    return {
      id: giftExchange.id,
      name: giftExchange.name,
      year: giftExchange.year,
      status: giftExchange.status,
      createdAt: giftExchange.createdAt.toISOString(),
      updatedAt: giftExchange.updatedAt.toISOString(),
      participants: giftExchange.participants?.map((ep: any) => ({
        id: ep.participant.id,
        name: ep.participant.name,
        email: ep.participant.email,
        createdAt: ep.participant.createdAt.toISOString(),
        updatedAt: ep.participant.updatedAt.toISOString(),
      })) || [],
      assignments: giftExchange.assignments?.map((assignment: any) => ({
        id: assignment.id,
        giftExchangeId: assignment.giftExchangeId,
        giver: {
          id: assignment.giver.id,
          name: assignment.giver.name,
          email: assignment.giver.email,
        },
        receiver: {
          id: assignment.receiver.id,
          name: assignment.receiver.name,
          email: assignment.receiver.email,
        },
        createdAt: assignment.createdAt.toISOString(),
      })) || [],
    };
  }
}
