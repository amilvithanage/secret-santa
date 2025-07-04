import { NotFoundError, ConflictError, ValidationError } from "../utils/errors";
import {
  CreateExclusionRuleRequest,
  ExclusionRuleResponse,
  PaginatedResponse,
} from "@secret-santa/shared-types";
import {
  GetExclusionsQuery,
  CreateExclusionRuleInput,
} from "../validation/exclusionRule";
import { GiftExchangeService } from "./giftExchangeService";
import DatabaseService from "./database";

export class ExclusionRuleService {
  private db = DatabaseService.getInstance().prisma;
  private giftExchangeService: GiftExchangeService;

  constructor() {
    this.giftExchangeService = new GiftExchangeService();
  }

  /**
   * Create a new exclusion rule
   */
  async createExclusionRule(
    giftExchangeId: string,
    data: CreateExclusionRuleInput,
  ): Promise<ExclusionRuleResponse> {
    // Validate the gift exchange exists and participants are in the exchange
    await this.giftExchangeService.getGiftExchangeById(giftExchangeId);
    await this.giftExchangeService.validateParticipantsInExchange(
      giftExchangeId,
      [data.excluderId, data.excludedId],
    );

    // Check for duplicate exclusion rule
    await this.checkDuplicateExclusion(
      giftExchangeId,
      data.excluderId,
      data.excludedId,
    );

    // Check if this exclusion would create circular exclusions
    await this.validateNoCircularExclusions(
      giftExchangeId,
      data.excluderId,
      data.excludedId,
    );

    try {
      const exclusionRule = await this.db.exclusionRule.create({
        data: {
          giftExchangeId,
          excluderId: data.excluderId,
          excludedId: data.excludedId,
          reason: data.reason,
        },
        include: {
          excluder: {
            select: { id: true, name: true, email: true },
          },
          excluded: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return this.mapToExclusionRuleResponse(exclusionRule);
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictError("This exclusion rule already exists");
      }
      throw error;
    }
  }

  /**
   * Get exclusion rules for a gift exchange with pagination
   */
  async getExclusionRulesForExchange(
    giftExchangeId: string,
    query: GetExclusionsQuery,
  ): Promise<PaginatedResponse<ExclusionRuleResponse>> {
    await this.giftExchangeService.getGiftExchangeById(giftExchangeId);

    const { page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const [exclusionRules, total] = await Promise.all([
      this.db.exclusionRule.findMany({
        where: { giftExchangeId },
        include: {
          excluder: {
            select: { id: true, name: true, email: true },
          },
          excluded: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.db.exclusionRule.count({
        where: { giftExchangeId },
      }),
    ]);

    const mappedRules = exclusionRules.map((rule: any) =>
      this.mapToExclusionRuleResponse(rule),
    );

    return {
      success: true,
      data: mappedRules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific exclusion rule by ID
   */
  async getExclusionRuleById(id: string): Promise<ExclusionRuleResponse> {
    const exclusionRule = await this.db.exclusionRule.findUnique({
      where: { id },
      include: {
        excluder: {
          select: { id: true, name: true, email: true },
        },
        excluded: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!exclusionRule) {
      throw new NotFoundError("Exclusion rule not found");
    }

    return this.mapToExclusionRuleResponse(exclusionRule);
  }

  /**
   * Delete an exclusion rule
   */
  async deleteExclusionRule(id: string): Promise<void> {
    const exclusionRule = await this.db.exclusionRule.findUnique({
      where: { id },
    });

    if (!exclusionRule) {
      throw new NotFoundError("Exclusion rule not found");
    }

    await this.db.exclusionRule.delete({
      where: { id },
    });
  }

  /**
   * Validate exclusion rules to prevent circular exclusions
   */
  async validateExclusionRules(
    giftExchangeId: string,
  ): Promise<{ valid: boolean; issues: string[] }> {
    const [participants, exclusions] = await Promise.all([
      this.giftExchangeService.getExchangeParticipants(giftExchangeId),
      this.db.exclusionRule.findMany({
        where: { giftExchangeId },
        include: {
          excluder: { select: { name: true } },
          excluded: { select: { name: true } },
        },
      }),
    ]);

    const issues: string[] = [];

    // Check for circular exclusions using graph traversal
    const exclusionGraph = this.buildExclusionGraph(exclusions);
    const circularPaths = this.detectCircularExclusions(
      exclusionGraph,
      participants,
    );

    if (circularPaths.length > 0) {
      circularPaths.forEach((path) => {
        issues.push(`Circular exclusion detected: ${path.join(" → ")}`);
      });
    }

    // Check if each participant has at least one valid receiver
    for (const participant of participants) {
      const validReceivers = participants.filter(
        (p: any) =>
          p.id !== participant.id && // Can't give to self
          !exclusions.some(
            (ex: any) =>
              ex.excluderId === participant.id && ex.excludedId === p.id,
          ),
      );

      if (validReceivers.length === 0) {
        issues.push(`${participant.name} has no valid gift recipients`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  // Private helper methods

  private async checkDuplicateExclusion(
    giftExchangeId: string,
    excluderId: string,
    excludedId: string,
  ): Promise<void> {
    const existing = await this.db.exclusionRule.findFirst({
      where: {
        giftExchangeId,
        excluderId,
        excludedId,
      },
    });

    if (existing) {
      throw new ConflictError("This exclusion rule already exists");
    }
  }

  private async validateNoCircularExclusions(
    giftExchangeId: string,
    excluderId: string,
    excludedId: string,
  ): Promise<void> {
    // Get existing exclusions
    const existingExclusions = await this.db.exclusionRule.findMany({
      where: { giftExchangeId },
    });

    // Simulate adding the new exclusion
    const allExclusions = [
      ...existingExclusions,
      { excluderId, excludedId, giftExchangeId },
    ];

    // Build exclusion graph
    const graph = this.buildExclusionGraph(allExclusions);

    // Check for circular exclusions
    if (this.hasCircularExclusion(graph, excluderId, excludedId)) {
      throw new ValidationError(
        "This exclusion would create a circular exclusion pattern",
      );
    }
  }

  private buildExclusionGraph(exclusions: any[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    exclusions.forEach((exclusion) => {
      if (!graph.has(exclusion.excluderId)) {
        graph.set(exclusion.excluderId, new Set());
      }
      graph.get(exclusion.excluderId)!.add(exclusion.excludedId);
    });

    return graph;
  }

  private hasCircularExclusion(
    graph: Map<string, Set<string>>,
    startId: string,
    targetId: string,
  ): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true; // Circular exclusion found
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    return dfs(startId);
  }

  private detectCircularExclusions(
    graph: Map<string, Set<string>>,
    participants: any[],
  ): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): void => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle, extract it
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), nodeId]);
        }
        return;
      }

      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = graph.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        dfs(neighbor);
      }

      recursionStack.delete(nodeId);
      path.pop();
    };

    participants.forEach((participant) => {
      if (!visited.has(participant.id)) {
        dfs(participant.id);
      }
    });

    return cycles;
  }

  private mapToExclusionRuleResponse(rule: any): ExclusionRuleResponse {
    return {
      id: rule.id,
      giftExchangeId: rule.giftExchangeId,
      excluder: rule.excluder,
      excluded: rule.excluded,
      reason: rule.reason,
      createdAt: rule.createdAt.toISOString(),
    };
  }
}
