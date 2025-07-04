import { Prisma } from '../generated/prisma';
import {
  CreateParticipantRequest,
  UpdateParticipantRequest,
  ParticipantResponse,
  PaginatedResponse,
} from '@secret-santa/shared-types';
import DatabaseService from './database';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';

export class ParticipantService {
  private db = DatabaseService.getInstance().prisma;

  async createParticipant(data: CreateParticipantRequest): Promise<ParticipantResponse> {
    // Check for duplicate email
    const existingParticipant = await this.db.participant.findUnique({
      where: { email: data.email }
    });

    if (existingParticipant) {
      throw new ConflictError('A participant with this email already exists');
    }
    
    try {
      const participant = await this.db.participant.create({
        data: {
          name: data.name,
          email: data.email,
        },
      });

      return this.mapToResponse(participant);
    } catch (error: unknown) {
      throw error;
    }
  }

  // Added optional pagination params: skip, take
  async getParticipants(page: number = 1, limit: number = 10): Promise<PaginatedResponse<ParticipantResponse>> {
    const skip = (page - 1) * limit;

    const [participants, total] = await Promise.all([
      this.db.participant.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.db.participant.count()
    ]);

    const mappedParticipants = participants.map(this.mapToResponse);

    return {
      success: true,
      data: mappedParticipants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getParticipantById(id: string): Promise<ParticipantResponse | null> {
    const participant = await this.db.participant.findUnique({
      where: { id },
    });
    if (!participant) {
      throw new NotFoundError('Participant not found');
    }
    return this.mapToResponse(participant);
  }

  async updateParticipant(id: string, data: Partial<UpdateParticipantRequest>): Promise<ParticipantResponse> {
    // Check for duplicate email
    const existingParticipant = await this.db.participant.findUnique({
      where: { email: data.email }
    });

    if (existingParticipant && existingParticipant.id !== id) {
      throw new ConflictError('A participant with this email already exists');
    }

    try {
      const participant = await this.db.participant.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
        },
      });

      return this.mapToResponse(participant);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundError('Participant not found');
        }
        if (error.code === 'P2002') {
          throw new BadRequestError('A participant with this email already exists');
        }
      }
      throw error;
    }
  }

  async deleteParticipant(id: string): Promise<void> {
    try {
      await this.db.participant.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundError('Participant not found');
        }
      }
      throw error;
    }
  }


  /**
   * Search participants by name or email
   */
  async searchParticipants(query: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<ParticipantResponse>> {
    const skip = (page - 1) * limit;

    const [participants, total] = await Promise.all([
      this.db.participant.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.db.participant.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        }
      })
    ]);

    const mappedParticipants = participants.map((p: any) => this.mapToResponse(p));

    return {
      success: true,
      data: mappedParticipants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  private mapToResponse(participant: any): ParticipantResponse {
    return {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      createdAt: participant.createdAt.toISOString(),
      updatedAt: participant.updatedAt.toISOString(),
    };
  }
}
