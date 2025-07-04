import { AssignmentService } from "../../src/services/AssignmentService";
import { GiftExchangeStatus } from "@secret-santa/shared-types";

// Mock the DatabaseService
const mockPrisma = {
  giftExchange: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  assignment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("../../src/services/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      prisma: mockPrisma,
    })),
  },
}));

describe("AssignmentService", () => {
  let assignmentService: AssignmentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    assignmentService = new AssignmentService();
  });

  describe("createAssignments", () => {
    it("should create assignments successfully", async () => {
      const giftExchangeId = "test-exchange-id";
      const mockGiftExchange = {
        id: giftExchangeId,
        participants: [
          {
            participant: {
              id: "alice-id",
              name: "Alice",
              email: "alice@example.com",
            },
          },
          {
            participant: {
              id: "bob-id",
              name: "Bob",
              email: "bob@example.com",
            },
          },
          {
            participant: {
              id: "charlie-id",
              name: "Charlie",
              email: "charlie@example.com",
            },
          },
        ],
        assignments: [],
        exclusionRules: [],
      };

      const mockCreatedAssignments = [
        {
          id: "assignment-1",
          giftExchangeId,
          giverId: "alice-id",
          receiverId: "bob-id",
          giver: { id: "alice-id", name: "Alice", email: "alice@example.com" },
          receiver: { id: "bob-id", name: "Bob", email: "bob@example.com" },
          createdAt: new Date(),
        },
      ];

      mockPrisma.giftExchange.findUnique.mockResolvedValue(mockGiftExchange);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          assignment: {
            create: jest.fn().mockResolvedValue(mockCreatedAssignments[0]),
          },
          giftExchange: {
            update: jest
              .fn()
              .mockResolvedValue({ ...mockGiftExchange, status: "ASSIGNED" }),
          },
        });
      });

      const result = await assignmentService.createAssignments({
        giftExchangeId,
      });

      expect(result.success).toBe(true);
      expect(result.assignments).toHaveLength(3);
      expect(mockPrisma.giftExchange.findUnique).toHaveBeenCalledWith({
        where: { id: giftExchangeId },
        include: {
          participants: { include: { participant: true } },
          assignments: true,
          exclusionRules: { include: { excluder: true, excluded: true } },
        },
      });
    });

    it("should throw error when gift exchange not found", async () => {
      const giftExchangeId = "non-existent-id";

      mockPrisma.giftExchange.findUnique.mockResolvedValue(null);

      await expect(
        assignmentService.createAssignments({ giftExchangeId }),
      ).rejects.toThrow("Gift exchange not found");
    });
  });

  describe("getAssignmentsByGiftExchange", () => {
    it("should return assignments for gift exchange", async () => {
      const giftExchangeId = "test-exchange-id";
      const mockAssignments = [
        {
          id: "assignment-1",
          giftExchangeId,
          giverId: "alice-id",
          receiverId: "bob-id",
          giver: { id: "alice-id", name: "Alice", email: "alice@example.com" },
          receiver: { id: "bob-id", name: "Bob", email: "bob@example.com" },
          createdAt: new Date(),
        },
      ];

      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments);

      const result =
        await assignmentService.getAssignmentsByGiftExchange(giftExchangeId);

      expect(result).toHaveLength(1);
      expect(result[0].giver.id).toBe("alice-id");
      expect(result[0].receiver.id).toBe("bob-id");
      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        where: { giftExchangeId },
        include: { giver: true, receiver: true },
        orderBy: { createdAt: "asc" },
      });
    });

    it("should return empty array when no assignments exist", async () => {
      const giftExchangeId = "test-exchange-id";

      mockPrisma.assignment.findMany.mockResolvedValue([]);

      const result =
        await assignmentService.getAssignmentsByGiftExchange(giftExchangeId);

      expect(result).toHaveLength(0);
    });
  });

  describe("deleteAssignmentsByGiftExchange", () => {
    it("should delete assignments and update status", async () => {
      const giftExchangeId = "test-exchange-id";

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          assignment: {
            deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
          },
          giftExchange: {
            update: jest.fn().mockResolvedValue({
              id: giftExchangeId,
              status: GiftExchangeStatus.PARTICIPANTS_ADDED,
            }),
          },
        });
      });

      await assignmentService.deleteAssignmentsByGiftExchange(giftExchangeId);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
