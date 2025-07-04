import { Assignment, GiftExchangeStatus } from "../generated/prisma";
import {
  CreateAssignmentsRequest,
  AssignmentResponse,
  AssignmentResult,
} from "@secret-santa/shared-types";
import DatabaseService from "./database";
import { NotFoundError, ValidationError } from "../utils/errors";

/**
 * Assignment Service - Business logic for Secret Santa assignment management
 * Handles CRUD operations for assignments with proper error handling
 * Implements the core Secret Santa assignment algorithm
 */
export class AssignmentService {
  private db = DatabaseService.getInstance().prisma;

  /**
   * Create Secret Santa assignments for a gift exchange
   */
  async createAssignments(
    data: CreateAssignmentsRequest,
  ): Promise<AssignmentResult> {
    try {
      // Validate gift exchange exists and is ready for assignment
      const giftExchange = await this.db.giftExchange.findUnique({
        where: { id: data.giftExchangeId },
        include: {
          participants: {
            include: {
              participant: true,
            },
          },
          assignments: true,
          exclusionRules: {
            include: {
              excluder: true,
              excluded: true,
            },
          },
        },
      });

      if (!giftExchange) {
        throw new NotFoundError("Gift exchange not found");
      }

      // Check if exchange has enough participants
      if (giftExchange.participants.length < 2) {
        throw new ValidationError(
          "Gift exchange must have at least 2 participants",
        );
      }

      // Check if assignments already exist
      if (giftExchange.assignments.length > 0) {
        throw new ValidationError(
          "Assignments already exist for this gift exchange",
        );
      }

      // Generate assignments using Secret Santa algorithm
      const assignmentPairs = await this.generateSecretSantaAssignments(
        giftExchange.participants.map(
          (p: { participant: any }) => p.participant,
        ),
        giftExchange.exclusionRules,
      );

      if (!assignmentPairs) {
        throw new ValidationError(
          "Unable to generate valid assignments with current exclusion rules",
        );
      }

      // Create assignments in database
      const createdAssignments = await this.db.$transaction(async (tx: any) => {
        const assignments = [];

        for (const pair of assignmentPairs) {
          const assignment = await tx.assignment.create({
            data: {
              giftExchangeId: data.giftExchangeId,
              giverId: pair.giverId,
              receiverId: pair.receiverId,
            },
            include: {
              giver: true,
              receiver: true,
            },
          });
          assignments.push(assignment);
        }

        // Update gift exchange status to ASSIGNED
        await tx.giftExchange.update({
          where: { id: data.giftExchangeId },
          data: { status: "ASSIGNED" as GiftExchangeStatus },
        });

        return assignments;
      });

      return {
        success: true,
        assignments: createdAssignments.map(this.mapToResponse),
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get all assignments
   */
  async getAllAssignments(): Promise<AssignmentResponse[]> {
    const assignments = await this.db.assignment.findMany({
      include: {
        giver: true,
        receiver: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return assignments.map(this.mapToResponse);
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(id: string): Promise<AssignmentResponse | null> {
    const assignment = await this.db.assignment.findUnique({
      where: { id },
      include: {
        giver: true,
        receiver: true,
      },
    });

    return assignment ? this.mapToResponse(assignment) : null;
  }

  /**
   * Get assignments for a gift exchange
   */
  async getAssignmentsByGiftExchange(
    giftExchangeId: string,
  ): Promise<AssignmentResponse[]> {
    const assignments = await this.db.assignment.findMany({
      where: { giftExchangeId },
      include: {
        giver: true,
        receiver: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return assignments.map(this.mapToResponse);
  }

  /**
   * Get assignment for a specific participant in a gift exchange
   */
  async getAssignmentForParticipant(
    giftExchangeId: string,
    participantId: string,
  ): Promise<AssignmentResponse | null> {
    const assignment = await this.db.assignment.findFirst({
      where: {
        giftExchangeId,
        giverId: participantId,
      },
      include: {
        giver: true,
        receiver: true,
      },
    });

    return assignment ? this.mapToResponse(assignment) : null;
  }

  /**
   * Delete all assignments for a gift exchange
   */
  async deleteAssignmentsByGiftExchange(giftExchangeId: string): Promise<void> {
    try {
      await this.db.$transaction(async (tx: any) => {
        // Delete all assignments
        await tx.assignment.deleteMany({
          where: { giftExchangeId },
        });

        // Update gift exchange status back to PARTICIPANTS_ADDED
        await tx.giftExchange.update({
          where: { id: giftExchangeId },
          data: { status: "PARTICIPANTS_ADDED" as GiftExchangeStatus },
        });
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Gift exchange not found");
      }
      throw error;
    }
  }

  /**
   * Core Secret Santa assignment algorithm
   * Ensures no one draws themselves and respects exclusion rules
   */
  private async generateSecretSantaAssignments(
    participants: any[],
    exclusionRules: any[],
  ): Promise<{ giverId: string; receiverId: string }[] | null> {
    const participantIds = participants.map((p: { id: any }) => p.id);
    const n = participantIds.length;

    // Build exclusion map for quick lookup
    const exclusions = new Map<string, Set<string>>();
    for (const participant of participants) {
      exclusions.set(participant.id, new Set());
    }

    // Add self-exclusions (no one can draw themselves)
    for (const participantId of participantIds) {
      exclusions.get(participantId)!.add(participantId);
    }

    // Add custom exclusion rules
    for (const rule of exclusionRules) {
      exclusions.get(rule.excluderId)!.add(rule.excludedId);
    }

    // Try to find valid assignment using backtracking
    const assignments: { giverId: string; receiverId: string }[] = [];
    const usedReceivers = new Set<string>();

    if (
      this.findAssignment(
        participantIds,
        0,
        exclusions,
        assignments,
        usedReceivers,
      )
    ) {
      return assignments;
    }

    // If backtracking fails, try multiple random shuffles
    for (let attempt = 0; attempt < 100; attempt++) {
      const shuffledGivers = [...participantIds].sort(
        () => Math.random() - 0.5,
      );
      const shuffledReceivers = [...participantIds].sort(
        () => Math.random() - 0.5,
      );

      const tempAssignments: { giverId: string; receiverId: string }[] = [];
      const tempUsedReceivers = new Set<string>();

      if (
        this.findAssignment(
          shuffledGivers,
          0,
          exclusions,
          tempAssignments,
          tempUsedReceivers,
        )
      ) {
        return tempAssignments;
      }
    }

    return null; // No valid assignment found
  }

  /**
   * Recursive backtracking algorithm to find valid assignments
   */
  private findAssignment(
    givers: string[],
    giverIndex: number,
    exclusions: Map<string, Set<string>>,
    assignments: { giverId: string; receiverId: string }[],
    usedReceivers: Set<string>,
  ): boolean {
    if (giverIndex === givers.length) {
      return true; // All givers assigned
    }

    const giverId = givers[giverIndex];
    const excludedReceivers = exclusions.get(giverId)!;

    // Try each possible receiver for this giver
    for (const receiverId of givers) {
      if (
        !usedReceivers.has(receiverId) &&
        !excludedReceivers.has(receiverId)
      ) {
        // Try this assignment
        assignments.push({ giverId, receiverId });
        usedReceivers.add(receiverId);

        // Recursively assign remaining givers
        if (
          this.findAssignment(
            givers,
            giverIndex + 1,
            exclusions,
            assignments,
            usedReceivers,
          )
        ) {
          return true;
        }

        // Backtrack
        assignments.pop();
        usedReceivers.delete(receiverId);
      }
    }

    return false; // No valid assignment for this giver
  }

  /**
   * Map Prisma assignment to API response format
   */
  private mapToResponse(assignment: any): AssignmentResponse {
    return {
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
    };
  }
}
