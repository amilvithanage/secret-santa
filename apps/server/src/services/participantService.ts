import { Participant } from '../generated/prisma';
import { CreateParticipantRequest, UpdateParticipantRequest, ParticipantResponse } from '@secret-santa/shared-types';
import DatabaseService from './database';

export class ParticipantService {
  private db = DatabaseService.getInstance().prisma;

  async createParticipant(data: CreateParticipantRequest): Promise<ParticipantResponse> {
    try {
      const participant = await this.db.participant.create({
        data: {
          name: data.name,
          email: data.email,
        },
      });

      return this.mapToResponse(participant);
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new Error('A participant with this email already exists');
      }
      throw error;
    }
  }

  async getAllParticipants(): Promise<ParticipantResponse[]> {
    const participants = await this.db.participant.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return participants.map(this.mapToResponse);
  }

  async getParticipantById(id: string): Promise<ParticipantResponse | null> {
    const participant = await this.db.participant.findUnique({
      where: { id },
    });

    return participant ? this.mapToResponse(participant) : null;
  }

  async updateParticipant(id: string, data: UpdateParticipantRequest): Promise<ParticipantResponse> {
    try {
      const participant = await this.db.participant.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
        },
      });

      return this.mapToResponse(participant);
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new Error('A participant with this email already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Participant not found');
      }
      throw error;
    }
  }

  async deleteParticipant(id: string): Promise<void> {
    try {
      await this.db.participant.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Participant not found');
      }
      throw error;
    }
  }

  async getParticipantByEmail(email: string): Promise<ParticipantResponse | null> {
    const participant = await this.db.participant.findUnique({
      where: { email },
    });

    return participant ? this.mapToResponse(participant) : null;
  }

  private mapToResponse(participant: Participant): ParticipantResponse {
    return {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      createdAt: participant.createdAt.toISOString(),
      updatedAt: participant.updatedAt.toISOString(),
    };
  }
}
