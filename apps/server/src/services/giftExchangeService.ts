import {
  CreateGiftExchangeRequest,
  UpdateGiftExchangeRequest,
  GiftExchangeResponse,
  AddParticipantToExchangeRequest,
  GiftExchangeStatus,
} from "@secret-santa/shared-types";
import DatabaseService from "./database";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors";
import { ParticipantService } from "./ParticipantService";

/**
 * Gift Exchange Service - Business logic for gift exchange management
 * Handles CRUD operations for gift exchanges with proper error handling
 */
export class GiftExchangeService {
  private db = DatabaseService.getInstance().prisma;
  private participantService = new ParticipantService();

  /**
   * Create a new gift exchange
   */
  async createGiftExchange(
    data: CreateGiftExchangeRequest,
  ): Promise<GiftExchangeResponse> {
    // Check for duplicate name in the same year
    const existingExchange = await this.db.giftExchange.findFirst({
      where: {
        name: data.name,
        year: data.year,
      },
    });

    if (existingExchange) {
      throw new ConflictError(
        `A gift exchange with name "${data.name}" already exists for year ${data.year}`,
      );
    }

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
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictError(
          "A gift exchange with this name and year already exists",
        );
      }
      throw error;
    }
  }

  /**
   * Get all gift exchanges with pagination
   */
  async getGiftExchanges(
    page: number = 1,
    limit: number = 10,
  ): Promise<GiftExchangeResponse[]> {
    const skip = (page - 1) * limit;

    const giftExchanges = await this.db.giftExchange.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        participants: {
          include: {
            participant: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
              },
            },
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

    return giftExchanges.map((exchange: any) => this.mapToResponse(exchange));
  }

  /**
   * Get gift exchange by ID
   */
  async getGiftExchangeById(id: string): Promise<GiftExchangeResponse> {
    const giftExchange = await this.db.giftExchange.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            participant: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!giftExchange) {
      throw new NotFoundError("Gift exchange not found");
    }

    return this.mapToResponse(giftExchange);
  }

  /**
   * Update gift exchange
   */
  async updateGiftExchange(
    id: string,
    data: UpdateGiftExchangeRequest,
  ): Promise<GiftExchangeResponse> {
    // Check if gift exchange exists
    const existingExchange = await this.getGiftExchangeById(id);

    // Validate status transitions
    if (data.status) {
      this.validateStatusTransition(
        existingExchange.status as GiftExchangeStatus,
        data.status,
      );
    }

    // Check for duplicate name/year if being updated
    if (data.name || data.year) {
      const duplicateCheck = await this.db.giftExchange.findFirst({
        where: {
          name: data.name || existingExchange.name,
          year: data.year || existingExchange.year,
          id: { not: id },
        },
      });

      if (duplicateCheck) {
        throw new ConflictError(
          "A gift exchange with this name and year already exists",
        );
      }
    }

    try {
      const giftExchange = await this.db.giftExchange.update({
        where: { id },
        data,
      });

      return this.mapToResponse(giftExchange);
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictError(
          "A gift exchange with this name and year already exists",
        );
      }
      throw error;
    }
  }

  /**
   * Delete gift exchange
   */
  async deleteGiftExchange(id: string): Promise<void> {
    // Check if gift exchange exists
    const giftExchange = await this.getGiftExchangeById(id);

    // Prevent deletion if assignments have been made
    if (
      giftExchange.status === GiftExchangeStatus.ASSIGNED ||
      giftExchange.status === GiftExchangeStatus.COMPLETED
    ) {
      throw new ValidationError(
        "Cannot delete gift exchange with assignments. Please reset assignments first.",
      );
    }

    await this.db.giftExchange.delete({
      where: { id },
    });
  }

  /**
   * Add participant to gift exchange
   */
  async addParticipantToExchange(
    giftExchangeId: string,
    data: AddParticipantToExchangeRequest,
  ): Promise<void> {
    // Validate gift exchange exists
    const giftExchange = await this.getGiftExchangeById(giftExchangeId);

    // Validate participant exists
    await this.participantService.getParticipantById(data.participantId);

    // Check if participant is already in the exchange
    const existingParticipant = await this.db.giftExchangeParticipant.findFirst(
      {
        where: {
          giftExchangeId,
          participantId: data.participantId,
        },
      },
    );

    if (existingParticipant) {
      throw new ConflictError(
        "Participant is already part of this gift exchange",
      );
    }

    // Prevent adding participants if assignments have been made
    if (
      giftExchange.status === GiftExchangeStatus.ASSIGNED ||
      giftExchange.status === GiftExchangeStatus.COMPLETED
    ) {
      throw new ValidationError(
        "Cannot add participants to gift exchange with assignments",
      );
    }

    await this.db.giftExchangeParticipant.create({
      data: {
        giftExchangeId,
        participantId: data.participantId,
      },
    });

    // Update status to PARTICIPANTS_ADDED if it was DRAFT
    if (giftExchange.status === GiftExchangeStatus.DRAFT) {
      await this.updateGiftExchange(giftExchangeId, {
        status: GiftExchangeStatus.PARTICIPANTS_ADDED,
      });
    }
  }

  /**
   * Remove participant from gift exchange
   */
  async removeParticipantFromExchange(
    giftExchangeId: string,
    participantId: string,
  ): Promise<GiftExchangeResponse> {
    // Validate gift exchange exists
    const giftExchange = await this.getGiftExchangeById(giftExchangeId);

    // Prevent removing participants if assignments have been made
    if (
      giftExchange.status === GiftExchangeStatus.ASSIGNED ||
      giftExchange.status === GiftExchangeStatus.COMPLETED
    ) {
      throw new ValidationError(
        "Cannot remove participants from gift exchange with assignments",
      );
    }

    // Check if participant is in the exchange
    const existingParticipant = await this.db.giftExchangeParticipant.findFirst(
      {
        where: {
          giftExchangeId,
          participantId,
        },
      },
    );

    if (!existingParticipant) {
      throw new NotFoundError("Participant is not part of this gift exchange");
    }

    await this.db.giftExchangeParticipant.delete({
      where: { id: existingParticipant.id },
    });

    return this.getGiftExchangeById(giftExchangeId);
  }

  /**
   * Get participants in a gift exchange
   */
  async getExchangeParticipants(giftExchangeId: string) {
    await this.getGiftExchangeById(giftExchangeId); // Validate exchange exists

    const participants = await this.db.giftExchangeParticipant.findMany({
      where: { giftExchangeId },
      include: {
        participant: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return participants.map((p: any) => p.participant);
  }

  /**
   * Validate if participants exist in exchange
   */
  async validateParticipantsInExchange(
    giftExchangeId: string,
    participantIds: string[],
  ): Promise<void> {
    const participants = await this.db.giftExchangeParticipant.findMany({
      where: {
        giftExchangeId,
        participantId: { in: participantIds },
      },
    });

    if (participants.length !== participantIds.length) {
      const foundIds = participants.map((p: any) => p.participantId);
      const missingIds = participantIds.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Participants not found in exchange: ${missingIds.join(", ")}`,
      );
    }
  }

  private validateStatusTransition(
    currentStatus: GiftExchangeStatus,
    newStatus: GiftExchangeStatus,
  ): void {
    const validTransitions: Record<GiftExchangeStatus, GiftExchangeStatus[]> = {
      [GiftExchangeStatus.DRAFT]: [GiftExchangeStatus.PARTICIPANTS_ADDED],
      [GiftExchangeStatus.PARTICIPANTS_ADDED]: [
        GiftExchangeStatus.ASSIGNED,
        GiftExchangeStatus.DRAFT,
      ],
      [GiftExchangeStatus.ASSIGNED]: [
        GiftExchangeStatus.COMPLETED,
        GiftExchangeStatus.PARTICIPANTS_ADDED,
      ],
      [GiftExchangeStatus.COMPLETED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
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
      participants:
        giftExchange.participants?.map((ep: any) => ({
          id: ep.participant.id,
          name: ep.participant.name,
          email: ep.participant.email,
          createdAt: ep.participant.createdAt.toISOString(),
          updatedAt: ep.participant.updatedAt.toISOString(),
        })) || [],
      assignments:
        giftExchange.assignments?.map((assignment: any) => ({
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
