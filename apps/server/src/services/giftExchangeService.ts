import { NotFoundError, ConflictError, ValidationError } from "../utils/errors";
import {
  CreateGiftExchangeRequest,
  UpdateGiftExchangeRequest,
  GiftExchangeResponse,
  PaginatedResponse,
  GiftExchangeStatus,
  AddParticipantToExchangeRequest,
} from "@secret-santa/shared-types";
import DatabaseService from "./database";

// Service response type without the success wrapper
interface ServicePaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GiftExchangeService {
  private db = DatabaseService.getInstance().prisma;
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
      });

      return this.mapToGiftExchangeResponse(giftExchange);
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
    includeParticipants: boolean = false,
  ): Promise<ServicePaginatedResponse<GiftExchangeResponse>> {
    const skip = (page - 1) * limit;

    const [giftExchanges, total] = await Promise.all([
      this.db.giftExchange.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          participants: includeParticipants
            ? {
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
              }
            : false,
        },
      }),
      this.db.giftExchange.count(),
    ]);

    const mappedExchanges = giftExchanges.map((ex: any) =>
      this.mapToGiftExchangeResponse(ex),
    );

    return {
      data: mappedExchanges,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get gift exchange by ID
   */
  async getGiftExchangeById(
    id: string,
    includeParticipants: boolean = false,
    includeAssignments: boolean = false,
  ): Promise<GiftExchangeResponse> {
    const giftExchange = await this.db.giftExchange.findUnique({
      where: { id },
      include: {
        participants: includeParticipants
          ? {
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
            }
          : false,
        assignments: includeAssignments
          ? {
              include: {
                giver: {
                  select: { id: true, name: true, email: true },
                },
                receiver: {
                  select: { id: true, name: true, email: true },
                },
              },
            }
          : false,
      },
    });

    if (!giftExchange) {
      throw new NotFoundError("Gift exchange not found");
    }

    return this.mapToGiftExchangeResponse(giftExchange);
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

      return this.mapToGiftExchangeResponse(giftExchange);
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
      giftExchange.status === "ASSIGNED" ||
      giftExchange.status === "COMPLETED"
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
    const participant = await this.db.participant.findUnique({
      where: { id: data.participantId },
    });

    if (!participant) {
      throw new NotFoundError("Participant not found");
    }

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
      giftExchange.status === "ASSIGNED" ||
      giftExchange.status === "COMPLETED"
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
    if (giftExchange.status === "DRAFT") {
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
  ): Promise<void> {
    // Validate gift exchange exists
    const giftExchange = await this.getGiftExchangeById(giftExchangeId);

    // Prevent removing participants if assignments have been made
    if (
      giftExchange.status === "ASSIGNED" ||
      giftExchange.status === "COMPLETED"
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
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return participants.map((p: any) => ({
      ...p.participant,
      createdAt: p.participant.createdAt.toISOString(),
      updatedAt: p.participant.updatedAt.toISOString(),
    }));
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

  private mapToGiftExchangeResponse(giftExchange: any): GiftExchangeResponse {
    return {
      id: giftExchange.id,
      name: giftExchange.name,
      year: giftExchange.year,
      status: giftExchange.status,
      createdAt: giftExchange.createdAt.toISOString(),
      updatedAt: giftExchange.updatedAt.toISOString(),
      participants: giftExchange.participants?.map((p: any) => ({
        id: p.participant.id,
        name: p.participant.name,
        email: p.participant.email,
        createdAt: p.participant.createdAt.toISOString(),
        updatedAt: p.participant.updatedAt.toISOString(),
      })),
      assignments: giftExchange.assignments?.map((a: any) => ({
        id: a.id,
        giftExchangeId: a.giftExchangeId,
        giver: a.giver,
        receiver: a.receiver,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }
}
