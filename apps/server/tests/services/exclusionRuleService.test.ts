import { ExclusionRuleService } from "../../src/services/exclusionRuleService";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../../src/utils/errors";
import { GiftExchangeStatus } from "@secret-santa/shared-types";

// Mock the DatabaseService
const mockPrisma = {
  exclusionRule: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  giftExchange: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  participant: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  giftExchangeParticipant: {
    findMany: jest.fn(),
  },
};

jest.mock("../../src/services/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      prisma: mockPrisma,
    })),
  },
}));

// Mock GiftExchangeService
const mockGiftExchangeService = {
  getGiftExchangeById: jest.fn(),
  validateParticipantsInExchange: jest.fn(),
  getExchangeParticipants: jest.fn(),
};

jest.mock("../../src/services/giftExchangeService", () => ({
  GiftExchangeService: jest
    .fn()
    .mockImplementation(() => mockGiftExchangeService),
}));

describe("ExclusionRuleService", () => {
  let exclusionRuleService: ExclusionRuleService;

  beforeEach(() => {
    jest.clearAllMocks();
    exclusionRuleService = new ExclusionRuleService();
  });

  describe("createExclusionRule", () => {
    const mockGiftExchange = {
      id: "gift-exchange-1",
      name: "Christmas 2024",
      year: 2024,
      status: GiftExchangeStatus.DRAFT,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    const mockExclusionRuleData = {
      excluderId: "participant-1",
      excludedId: "participant-2",
      reason: "They are siblings",
    };

    const mockCreatedExclusionRule = {
      id: "exclusion-rule-1",
      giftExchangeId: "gift-exchange-1",
      excluderId: "participant-1",
      excludedId: "participant-2",
      reason: "They are siblings",
      createdAt: new Date("2024-01-01"),
      excluder: {
        id: "participant-1",
        name: "John Doe",
        email: "john@example.com",
      },
      excluded: {
        id: "participant-2",
        name: "Jane Smith",
        email: "jane@example.com",
      },
    };

    beforeEach(() => {
      mockGiftExchangeService.getGiftExchangeById.mockResolvedValue(
        mockGiftExchange,
      );
      mockGiftExchangeService.validateParticipantsInExchange.mockResolvedValue(
        undefined,
      );
      mockPrisma.exclusionRule.findFirst.mockResolvedValue(null);
      mockPrisma.exclusionRule.findMany.mockResolvedValue([]);
    });

    it("should create a new exclusion rule successfully", async () => {
      mockPrisma.exclusionRule.create.mockResolvedValue(
        mockCreatedExclusionRule,
      );

      const result = await exclusionRuleService.createExclusionRule(
        "gift-exchange-1",
        mockExclusionRuleData,
      );

      expect(mockGiftExchangeService.getGiftExchangeById).toHaveBeenCalledWith(
        "gift-exchange-1",
      );
      expect(
        mockGiftExchangeService.validateParticipantsInExchange,
      ).toHaveBeenCalledWith("gift-exchange-1", [
        "participant-1",
        "participant-2",
      ]);
      expect(mockPrisma.exclusionRule.findFirst).toHaveBeenCalledWith({
        where: {
          giftExchangeId: "gift-exchange-1",
          excluderId: "participant-1",
          excludedId: "participant-2",
        },
      });
      expect(mockPrisma.exclusionRule.create).toHaveBeenCalledWith({
        data: {
          giftExchangeId: "gift-exchange-1",
          excluderId: "participant-1",
          excludedId: "participant-2",
          reason: "They are siblings",
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

      expect(result).toEqual({
        id: "exclusion-rule-1",
        giftExchangeId: "gift-exchange-1",
        excluder: {
          id: "participant-1",
          name: "John Doe",
          email: "john@example.com",
        },
        excluded: {
          id: "participant-2",
          name: "Jane Smith",
          email: "jane@example.com",
        },
        reason: "They are siblings",
        createdAt: mockCreatedExclusionRule.createdAt.toISOString(),
      });
    });

    it("should throw ConflictError when duplicate exclusion rule exists", async () => {
      mockPrisma.exclusionRule.findFirst.mockResolvedValue(
        mockCreatedExclusionRule,
      );

      await expect(
        exclusionRuleService.createExclusionRule(
          "gift-exchange-1",
          mockExclusionRuleData,
        ),
      ).rejects.toThrow(ConflictError);
      await expect(
        exclusionRuleService.createExclusionRule(
          "gift-exchange-1",
          mockExclusionRuleData,
        ),
      ).rejects.toThrow("This exclusion rule already exists");
    });

    it("should throw ConflictError when Prisma returns P2002 error", async () => {
      const prismaError = new Error("Unique constraint failed");
      (prismaError as any).code = "P2002";
      mockPrisma.exclusionRule.create.mockRejectedValue(prismaError);

      await expect(
        exclusionRuleService.createExclusionRule(
          "gift-exchange-1",
          mockExclusionRuleData,
        ),
      ).rejects.toThrow(ConflictError);
      await expect(
        exclusionRuleService.createExclusionRule(
          "gift-exchange-1",
          mockExclusionRuleData,
        ),
      ).rejects.toThrow("This exclusion rule already exists");
    });

    it("should throw ValidationError when circular exclusion would be created", async () => {
      // Mock existing exclusions that would create a circular pattern
      mockPrisma.exclusionRule.findMany.mockResolvedValue([
        {
          excluderId: "participant-2",
          excludedId: "participant-1",
          giftExchangeId: "gift-exchange-1",
        },
      ]);

      await expect(
        exclusionRuleService.createExclusionRule(
          "gift-exchange-1",
          mockExclusionRuleData,
        ),
      ).rejects.toThrow(ValidationError);
      await expect(
        exclusionRuleService.createExclusionRule(
          "gift-exchange-1",
          mockExclusionRuleData,
        ),
      ).rejects.toThrow(
        "This exclusion would create a circular exclusion pattern",
      );
    });
  });

  describe("getExclusionRulesForExchange", () => {
    const mockGiftExchange = {
      id: "gift-exchange-1",
      name: "Christmas 2024",
      year: 2024,
      status: GiftExchangeStatus.DRAFT,
    };

    const mockExclusionRules = [
      {
        id: "exclusion-rule-1",
        giftExchangeId: "gift-exchange-1",
        excluderId: "participant-1",
        excludedId: "participant-2",
        reason: "They are siblings",
        createdAt: new Date("2024-01-01"),
        excluder: {
          id: "participant-1",
          name: "John Doe",
          email: "john@example.com",
        },
        excluded: {
          id: "participant-2",
          name: "Jane Smith",
          email: "jane@example.com",
        },
      },
      {
        id: "exclusion-rule-2",
        giftExchangeId: "gift-exchange-1",
        excluderId: "participant-3",
        excludedId: "participant-4",
        reason: "They are roommates",
        createdAt: new Date("2024-01-02"),
        excluder: {
          id: "participant-3",
          name: "Bob Wilson",
          email: "bob@example.com",
        },
        excluded: {
          id: "participant-4",
          name: "Alice Brown",
          email: "alice@example.com",
        },
      },
    ];

    beforeEach(() => {
      mockGiftExchangeService.getGiftExchangeById.mockResolvedValue(
        mockGiftExchange,
      );
    });

    it("should get exclusion rules with pagination", async () => {
      mockPrisma.exclusionRule.findMany.mockResolvedValue(mockExclusionRules);
      mockPrisma.exclusionRule.count.mockResolvedValue(2);

      const query = {
        page: 1,
        limit: 10,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
      };

      const result = await exclusionRuleService.getExclusionRulesForExchange(
        "gift-exchange-1",
        query,
      );

      expect(mockGiftExchangeService.getGiftExchangeById).toHaveBeenCalledWith(
        "gift-exchange-1",
      );
      expect(mockPrisma.exclusionRule.findMany).toHaveBeenCalledWith({
        where: { giftExchangeId: "gift-exchange-1" },
        include: {
          excluder: {
            select: { id: true, name: true, email: true },
          },
          excluded: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
      expect(mockPrisma.exclusionRule.count).toHaveBeenCalledWith({
        where: { giftExchangeId: "gift-exchange-1" },
      });

      expect(result).toEqual({
        success: true,
        data: [
          {
            id: "exclusion-rule-1",
            giftExchangeId: "gift-exchange-1",
            excluder: {
              id: "participant-1",
              name: "John Doe",
              email: "john@example.com",
            },
            excluded: {
              id: "participant-2",
              name: "Jane Smith",
              email: "jane@example.com",
            },
            reason: "They are siblings",
            createdAt: mockExclusionRules[0].createdAt.toISOString(),
          },
          {
            id: "exclusion-rule-2",
            giftExchangeId: "gift-exchange-1",
            excluder: {
              id: "participant-3",
              name: "Bob Wilson",
              email: "bob@example.com",
            },
            excluded: {
              id: "participant-4",
              name: "Alice Brown",
              email: "alice@example.com",
            },
            reason: "They are roommates",
            createdAt: mockExclusionRules[1].createdAt.toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it("should return empty array when no exclusion rules exist", async () => {
      mockPrisma.exclusionRule.findMany.mockResolvedValue([]);
      mockPrisma.exclusionRule.count.mockResolvedValue(0);

      const query = {
        page: 1,
        limit: 10,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
      };

      const result = await exclusionRuleService.getExclusionRulesForExchange(
        "gift-exchange-1",
        query,
      );

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it("should handle pagination correctly", async () => {
      mockPrisma.exclusionRule.findMany.mockResolvedValue([
        mockExclusionRules[0],
      ]);
      mockPrisma.exclusionRule.count.mockResolvedValue(15);

      const query = {
        page: 2,
        limit: 5,
        sortBy: "createdAt" as const,
        sortOrder: "asc" as const,
      };

      const result = await exclusionRuleService.getExclusionRulesForExchange(
        "gift-exchange-1",
        query,
      );

      expect(mockPrisma.exclusionRule.findMany).toHaveBeenCalledWith({
        where: { giftExchangeId: "gift-exchange-1" },
        include: {
          excluder: {
            select: { id: true, name: true, email: true },
          },
          excluded: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
        skip: 5,
        take: 5,
      });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 15,
        totalPages: 3,
      });
    });
  });

  describe("getExclusionRuleById", () => {
    const mockExclusionRule = {
      id: "exclusion-rule-1",
      giftExchangeId: "gift-exchange-1",
      excluderId: "participant-1",
      excludedId: "participant-2",
      reason: "They are siblings",
      createdAt: new Date("2024-01-01"),
      excluder: {
        id: "participant-1",
        name: "John Doe",
        email: "john@example.com",
      },
      excluded: {
        id: "participant-2",
        name: "Jane Smith",
        email: "jane@example.com",
      },
    };

    it("should get exclusion rule by ID successfully", async () => {
      mockPrisma.exclusionRule.findUnique.mockResolvedValue(mockExclusionRule);

      const result =
        await exclusionRuleService.getExclusionRuleById("exclusion-rule-1");

      expect(mockPrisma.exclusionRule.findUnique).toHaveBeenCalledWith({
        where: { id: "exclusion-rule-1" },
        include: {
          excluder: {
            select: { id: true, name: true, email: true },
          },
          excluded: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      expect(result).toEqual({
        id: "exclusion-rule-1",
        giftExchangeId: "gift-exchange-1",
        excluder: {
          id: "participant-1",
          name: "John Doe",
          email: "john@example.com",
        },
        excluded: {
          id: "participant-2",
          name: "Jane Smith",
          email: "jane@example.com",
        },
        reason: "They are siblings",
        createdAt: mockExclusionRule.createdAt.toISOString(),
      });
    });

    it("should throw NotFoundError when exclusion rule does not exist", async () => {
      mockPrisma.exclusionRule.findUnique.mockResolvedValue(null);

      await expect(
        exclusionRuleService.getExclusionRuleById("non-existent-id"),
      ).rejects.toThrow(NotFoundError);
      await expect(
        exclusionRuleService.getExclusionRuleById("non-existent-id"),
      ).rejects.toThrow("Exclusion rule not found");
    });
  });

  describe("deleteExclusionRule", () => {
    const mockExclusionRule = {
      id: "exclusion-rule-1",
      giftExchangeId: "gift-exchange-1",
      excluderId: "participant-1",
      excludedId: "participant-2",
      reason: "They are siblings",
      createdAt: new Date("2024-01-01"),
    };

    it("should delete exclusion rule successfully", async () => {
      mockPrisma.exclusionRule.findUnique.mockResolvedValue(mockExclusionRule);
      mockPrisma.exclusionRule.delete.mockResolvedValue(mockExclusionRule);

      await exclusionRuleService.deleteExclusionRule("exclusion-rule-1");

      expect(mockPrisma.exclusionRule.findUnique).toHaveBeenCalledWith({
        where: { id: "exclusion-rule-1" },
      });
      expect(mockPrisma.exclusionRule.delete).toHaveBeenCalledWith({
        where: { id: "exclusion-rule-1" },
      });
    });

    it("should throw NotFoundError when exclusion rule does not exist", async () => {
      mockPrisma.exclusionRule.findUnique.mockResolvedValue(null);

      await expect(
        exclusionRuleService.deleteExclusionRule("non-existent-id"),
      ).rejects.toThrow(NotFoundError);
      await expect(
        exclusionRuleService.deleteExclusionRule("non-existent-id"),
      ).rejects.toThrow("Exclusion rule not found");

      expect(mockPrisma.exclusionRule.delete).not.toHaveBeenCalled();
    });
  });

  describe("validateExclusionRules", () => {
    const mockParticipants = [
      {
        id: "participant-1",
        name: "John Doe",
        email: "john@example.com",
      },
      {
        id: "participant-2",
        name: "Jane Smith",
        email: "jane@example.com",
      },
      {
        id: "participant-3",
        name: "Bob Wilson",
        email: "bob@example.com",
      },
      {
        id: "participant-4",
        name: "Alice Brown",
        email: "alice@example.com",
      },
    ];

    beforeEach(() => {
      mockGiftExchangeService.getExchangeParticipants.mockResolvedValue(
        mockParticipants,
      );
    });

    it("should return valid when no exclusion rules exist", async () => {
      mockPrisma.exclusionRule.findMany.mockResolvedValue([]);

      const result =
        await exclusionRuleService.validateExclusionRules("gift-exchange-1");

      expect(result).toEqual({
        valid: true,
        issues: [],
      });
    });

    it("should return valid when exclusion rules are valid", async () => {
      const mockExclusionRules = [
        {
          excluderId: "participant-1",
          excludedId: "participant-2",
          excluder: { name: "John Doe" },
          excluded: { name: "Jane Smith" },
        },
      ];
      mockPrisma.exclusionRule.findMany.mockResolvedValue(mockExclusionRules);

      const result =
        await exclusionRuleService.validateExclusionRules("gift-exchange-1");

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it("should detect circular exclusions", async () => {
      const mockExclusionRules = [
        {
          excluderId: "participant-1",
          excludedId: "participant-2",
          excluder: { name: "John Doe" },
          excluded: { name: "Jane Smith" },
        },
        {
          excluderId: "participant-2",
          excludedId: "participant-1",
          excluder: { name: "Jane Smith" },
          excluded: { name: "John Doe" },
        },
      ];
      mockPrisma.exclusionRule.findMany.mockResolvedValue(mockExclusionRules);

      const result =
        await exclusionRuleService.validateExclusionRules("gift-exchange-1");

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(
        result.issues.some((issue) =>
          issue.includes("Circular exclusion detected"),
        ),
      ).toBe(true);
    });

    it("should detect when participant has no valid recipients", async () => {
      // Create exclusions where participant-1 excludes everyone else
      const mockExclusionRules = [
        {
          excluderId: "participant-1",
          excludedId: "participant-2",
          excluder: { name: "John Doe" },
          excluded: { name: "Jane Smith" },
        },
        {
          excluderId: "participant-1",
          excludedId: "participant-3",
          excluder: { name: "John Doe" },
          excluded: { name: "Bob Wilson" },
        },
        {
          excluderId: "participant-1",
          excludedId: "participant-4",
          excluder: { name: "John Doe" },
          excluded: { name: "Alice Brown" },
        },
      ];
      mockPrisma.exclusionRule.findMany.mockResolvedValue(mockExclusionRules);

      const result =
        await exclusionRuleService.validateExclusionRules("gift-exchange-1");

      expect(result.valid).toBe(false);
      expect(
        result.issues.some((issue) =>
          issue.includes("John Doe has no valid gift recipients"),
        ),
      ).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should propagate errors from gift exchange service", async () => {
      const error = new NotFoundError("Gift exchange not found");
      mockGiftExchangeService.getGiftExchangeById.mockRejectedValue(error);

      await expect(
        exclusionRuleService.createExclusionRule("non-existent-id", {
          excluderId: "participant-1",
          excludedId: "participant-2",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("should propagate database errors", async () => {
      mockGiftExchangeService.getGiftExchangeById.mockResolvedValue({});
      mockGiftExchangeService.validateParticipantsInExchange.mockResolvedValue(
        undefined,
      );
      mockPrisma.exclusionRule.findFirst.mockResolvedValue(null);
      mockPrisma.exclusionRule.findMany.mockResolvedValue([]);

      const dbError = new Error("Database connection failed");
      mockPrisma.exclusionRule.create.mockRejectedValue(dbError);

      await expect(
        exclusionRuleService.createExclusionRule("gift-exchange-1", {
          excluderId: "participant-1",
          excludedId: "participant-2",
        }),
      ).rejects.toThrow("Database connection failed");
    });
  });
});
