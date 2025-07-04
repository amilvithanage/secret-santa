import { AssignmentService } from "../../src/services/AssignmentService";
import DatabaseService from "../../src/services/database";
import { CreateAssignmentsRequest } from "@secret-santa/shared-types";
import { Prisma, GiftExchangeStatus } from "../../src/generated/prisma";
import { NotFoundError, ValidationError } from "../../src/utils/errors";

// Mock the DatabaseService
jest.mock("../../src/services/database");

describe("AssignmentService", () => {
  let assignmentService: AssignmentService;
  let mockPrisma: any;
  let mockTransaction: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock transaction
    mockTransaction = {
      assignment: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      giftExchange: {
        update: jest.fn(),
      },
    };

    // Create mock Prisma client
    mockPrisma = {
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

    // Mock DatabaseService.getInstance().prisma
    (DatabaseService.getInstance as jest.Mock).mockReturnValue({
      prisma: mockPrisma,
    });

    assignmentService = new AssignmentService();
  });

  describe("createAssignments", () => {
    const mockGiftExchange = {
      id: "test-exchange-id",
      name: "Christmas 2024",
      year: 2024,
      status: "PARTICIPANTS_ADDED" as GiftExchangeStatus,
      participants: [
        {
          id: "gep-1",
          participant: {
            id: "participant-1",
            name: "John Doe",
            email: "john@example.com",
          },
        },
        {
          id: "gep-2",
          participant: {
            id: "participant-2",
            name: "Jane Smith",
            email: "jane@example.com",
          },
        },
      ],
      assignments: [],
      exclusionRules: [],
    };

    it("should create assignments successfully", async () => {
      const request: CreateAssignmentsRequest = {
        giftExchangeId: "test-exchange-id",
      };

      const mockCreatedAssignments = [
        {
          id: "assignment-1",
          giftExchangeId: "test-exchange-id",
          giverId: "participant-1",
          receiverId: "participant-2",
          createdAt: new Date(),
          giver: {
            id: "participant-1",
            name: "John Doe",
            email: "john@example.com",
          },
          receiver: {
            id: "participant-2",
            name: "Jane Smith",
            email: "jane@example.com",
          },
        },
        {
          id: "assignment-2",
          giftExchangeId: "test-exchange-id",
          giverId: "participant-2",
          receiverId: "participant-1",
          createdAt: new Date(),
          giver: {
            id: "participant-2",
            name: "Jane Smith",
            email: "jane@example.com",
          },
          receiver: {
            id: "participant-1",
            name: "John Doe",
            email: "john@example.com",
          },
        },
      ];

      mockPrisma.giftExchange.findUnique.mockResolvedValue(mockGiftExchange);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockTransaction);
      });
      mockTransaction.assignment.create
        .mockResolvedValueOnce(mockCreatedAssignments[0])
        .mockResolvedValueOnce(mockCreatedAssignments[1]);

      const result = await assignmentService.createAssignments(request);

      expect(result.success).toBe(true);
      expect(result.assignments).toHaveLength(2);
      expect(result.assignments![0]).toEqual({
        id: "assignment-1",
        giftExchangeId: "test-exchange-id",
        giver: {
          id: "participant-1",
          name: "John Doe",
          email: "john@example.com",
        },
        receiver: {
          id: "participant-2",
          name: "Jane Smith",
          email: "jane@example.com",
        },
        createdAt: mockCreatedAssignments[0].createdAt.toISOString(),
      });
    });

    it("should throw NotFoundError when gift exchange does not exist", async () => {
      const request: CreateAssignmentsRequest = {
        giftExchangeId: "non-existent-id",
      };

      mockPrisma.giftExchange.findUnique.mockResolvedValue(null);

      await expect(
        assignmentService.createAssignments(request),
      ).rejects.toThrow(NotFoundError);
      await expect(
        assignmentService.createAssignments(request),
      ).rejects.toThrow("Gift exchange not found");
    });

    it("should throw ValidationError when not enough participants", async () => {
      const request: CreateAssignmentsRequest = {
        giftExchangeId: "test-exchange-id",
      };

      const mockGiftExchangeWithOneParticipant = {
        ...mockGiftExchange,
        participants: [mockGiftExchange.participants[0]],
      };

      mockPrisma.giftExchange.findUnique.mockResolvedValue(
        mockGiftExchangeWithOneParticipant,
      );

      await expect(
        assignmentService.createAssignments(request),
      ).rejects.toThrow(ValidationError);
      await expect(
        assignmentService.createAssignments(request),
      ).rejects.toThrow("Gift exchange must have at least 2 participants");
    });

    it("should throw ValidationError when assignments already exist", async () => {
      const request: CreateAssignmentsRequest = {
        giftExchangeId: "test-exchange-id",
      };

      const mockGiftExchangeWithAssignments = {
        ...mockGiftExchange,
        assignments: [{ id: "existing-assignment" }],
      };

      mockPrisma.giftExchange.findUnique.mockResolvedValue(
        mockGiftExchangeWithAssignments,
      );

      await expect(
        assignmentService.createAssignments(request),
      ).rejects.toThrow(ValidationError);
      await expect(
        assignmentService.createAssignments(request),
      ).rejects.toThrow("Assignments already exist for this gift exchange");
    });
  });

  describe("getAllAssignments", () => {
    it("should return all assignments", async () => {
      const mockAssignments = [
        {
          id: "assignment-1",
          giftExchangeId: "exchange-1",
          giverId: "participant-1",
          receiverId: "participant-2",
          createdAt: new Date(),
          giver: {
            id: "participant-1",
            name: "John Doe",
            email: "john@example.com",
          },
          receiver: {
            id: "participant-2",
            name: "Jane Smith",
            email: "jane@example.com",
          },
        },
      ];

      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments);

      const result = await assignmentService.getAllAssignments();

      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        include: {
          giver: true,
          receiver: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "assignment-1",
        giftExchangeId: "exchange-1",
        giver: {
          id: "participant-1",
          name: "John Doe",
          email: "john@example.com",
        },
        receiver: {
          id: "participant-2",
          name: "Jane Smith",
          email: "jane@example.com",
        },
        createdAt: mockAssignments[0].createdAt.toISOString(),
      });
    });

    it("should return empty array when no assignments exist", async () => {
      mockPrisma.assignment.findMany.mockResolvedValue([]);

      const result = await assignmentService.getAllAssignments();

      expect(result).toEqual([]);
    });
  });

  describe("getAssignmentById", () => {
    it("should return assignment when found", async () => {
      const mockAssignment = {
        id: "assignment-1",
        giftExchangeId: "exchange-1",
        giverId: "participant-1",
        receiverId: "participant-2",
        createdAt: new Date(),
        giver: {
          id: "participant-1",
          name: "John Doe",
          email: "john@example.com",
        },
        receiver: {
          id: "participant-2",
          name: "Jane Smith",
          email: "jane@example.com",
        },
      };

      mockPrisma.assignment.findUnique.mockResolvedValue(mockAssignment);

      const result = await assignmentService.getAssignmentById("assignment-1");

      expect(mockPrisma.assignment.findUnique).toHaveBeenCalledWith({
        where: { id: "assignment-1" },
        include: {
          giver: true,
          receiver: true,
        },
      });
      expect(result).toEqual({
        id: "assignment-1",
        giftExchangeId: "exchange-1",
        giver: {
          id: "participant-1",
          name: "John Doe",
          email: "john@example.com",
        },
        receiver: {
          id: "participant-2",
          name: "Jane Smith",
          email: "jane@example.com",
        },
        createdAt: mockAssignment.createdAt.toISOString(),
      });
    });

    it("should return null when assignment not found", async () => {
      mockPrisma.assignment.findUnique.mockResolvedValue(null);

      const result =
        await assignmentService.getAssignmentById("non-existent-id");

      expect(result).toBeNull();
    });
  });

  describe("getAssignmentsByGiftExchange", () => {
    it("should return assignments for a gift exchange", async () => {
      const mockAssignments = [
        {
          id: "assignment-1",
          giftExchangeId: "exchange-1",
          giverId: "participant-1",
          receiverId: "participant-2",
          createdAt: new Date(),
          giver: {
            id: "participant-1",
            name: "John Doe",
            email: "john@example.com",
          },
          receiver: {
            id: "participant-2",
            name: "Jane Smith",
            email: "jane@example.com",
          },
        },
      ];

      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments);

      const result =
        await assignmentService.getAssignmentsByGiftExchange("exchange-1");

      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        where: { giftExchangeId: "exchange-1" },
        include: {
          giver: true,
          receiver: true,
        },
        orderBy: { createdAt: "asc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].giftExchangeId).toBe("exchange-1");
    });

    it("should return empty array when no assignments exist for exchange", async () => {
      mockPrisma.assignment.findMany.mockResolvedValue([]);

      const result =
        await assignmentService.getAssignmentsByGiftExchange("exchange-1");

      expect(result).toEqual([]);
    });
  });

  describe("deleteAssignmentsByGiftExchange", () => {
    it("should delete all assignments and update gift exchange status", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockTransaction);
      });

      await assignmentService.deleteAssignmentsByGiftExchange("exchange-1");

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockTransaction.assignment.deleteMany).toHaveBeenCalledWith({
        where: { giftExchangeId: "exchange-1" },
      });
      expect(mockTransaction.giftExchange.update).toHaveBeenCalledWith({
        where: { id: "exchange-1" },
        data: { status: "PARTICIPANTS_ADDED" as GiftExchangeStatus },
      });
    });

    it("should throw NotFoundError when gift exchange not found", async () => {
      const mockError = new Prisma.PrismaClientKnownRequestError(
        "Record to update not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );

      mockPrisma.$transaction.mockRejectedValue(mockError);

      await expect(
        assignmentService.deleteAssignmentsByGiftExchange("non-existent-id"),
      ).rejects.toThrow(NotFoundError);
      await expect(
        assignmentService.deleteAssignmentsByGiftExchange("non-existent-id"),
      ).rejects.toThrow("Gift exchange not found");
    });

    it("should rethrow other errors", async () => {
      const mockError = new Error("Database connection error");
      mockPrisma.$transaction.mockRejectedValue(mockError);

      await expect(
        assignmentService.deleteAssignmentsByGiftExchange("exchange-1"),
      ).rejects.toThrow("Database connection error");
    });
  });

  describe("Secret Santa Algorithm Edge Cases", () => {
    it("should handle assignments with exclusion rules", async () => {
      const request: CreateAssignmentsRequest = {
        giftExchangeId: "test-exchange-id",
      };

      const mockGiftExchangeWithExclusions = {
        id: "test-exchange-id",
        name: "Christmas 2024",
        year: 2024,
        status: "PARTICIPANTS_ADDED" as GiftExchangeStatus,
        participants: [
          {
            id: "gep-1",
            participant: {
              id: "participant-1",
              name: "John Doe",
              email: "john@example.com",
            },
          },
          {
            id: "gep-2",
            participant: {
              id: "participant-2",
              name: "Jane Smith",
              email: "jane@example.com",
            },
          },
          {
            id: "gep-3",
            participant: {
              id: "participant-3",
              name: "Bob Johnson",
              email: "bob@example.com",
            },
          },
        ],
        assignments: [],
        exclusionRules: [
          {
            id: "rule-1",
            excluderId: "participant-1",
            excludedId: "participant-2",
            reason: "Married couple",
          },
        ],
      };

      const mockCreatedAssignments = [
        {
          id: "assignment-1",
          giftExchangeId: "test-exchange-id",
          giverId: "participant-1",
          receiverId: "participant-3",
          createdAt: new Date(),
          giver: {
            id: "participant-1",
            name: "John Doe",
            email: "john@example.com",
          },
          receiver: {
            id: "participant-3",
            name: "Bob Johnson",
            email: "bob@example.com",
          },
        },
      ];

      mockPrisma.giftExchange.findUnique.mockResolvedValue(
        mockGiftExchangeWithExclusions,
      );
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockTransaction);
      });
      mockTransaction.assignment.create.mockResolvedValue(
        mockCreatedAssignments[0],
      );

      const result = await assignmentService.createAssignments(request);

      expect(result.success).toBe(true);
      expect(result.assignments).toBeDefined();
      // Verify that exclusion rules are respected
      expect(result.assignments![0].giver.id).toBe("participant-1");
      expect(result.assignments![0].receiver.id).toBe("participant-3"); // Not participant-2 due to exclusion
    });

    it("should return error when no valid assignments possible", async () => {
      const request: CreateAssignmentsRequest = {
        giftExchangeId: "test-exchange-id",
      };

      // Create a scenario where assignments are impossible
      const mockGiftExchangeImpossible = {
        id: "test-exchange-id",
        name: "Christmas 2024",
        year: 2024,
        status: "PARTICIPANTS_ADDED" as GiftExchangeStatus,
        participants: [
          {
            id: "gep-1",
            participant: {
              id: "participant-1",
              name: "John Doe",
              email: "john@example.com",
            },
          },
          {
            id: "gep-2",
            participant: {
              id: "participant-2",
              name: "Jane Smith",
              email: "jane@example.com",
            },
          },
        ],
        assignments: [],
        exclusionRules: [
          // Each participant excludes the other, making assignment impossible
          {
            id: "rule-1",
            excluderId: "participant-1",
            excludedId: "participant-2",
          },
          {
            id: "rule-2",
            excluderId: "participant-2",
            excludedId: "participant-1",
          },
        ],
      };

      mockPrisma.giftExchange.findUnique.mockResolvedValue(
        mockGiftExchangeImpossible,
      );

      await expect(
        assignmentService.createAssignments(request),
      ).rejects.toThrow(ValidationError);
      await expect(
        assignmentService.createAssignments(request),
      ).rejects.toThrow(
        "Unable to generate valid assignments with current exclusion rules",
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors during assignment creation", async () => {
      const request: CreateAssignmentsRequest = {
        giftExchangeId: "test-exchange-id",
      };

      const mockGiftExchange = {
        id: "test-exchange-id",
        participants: [
          {
            id: "gep-1",
            participant: {
              id: "participant-1",
              name: "John",
              email: "john@example.com",
            },
          },
          {
            id: "gep-2",
            participant: {
              id: "participant-2",
              name: "Jane",
              email: "jane@example.com",
            },
          },
        ],
        assignments: [],
        exclusionRules: [],
      };

      mockPrisma.giftExchange.findUnique.mockResolvedValue(mockGiftExchange);
      mockPrisma.$transaction.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(
        assignmentService.createAssignments(request),
      ).rejects.toThrow("Database connection failed");
    });
  });
});
