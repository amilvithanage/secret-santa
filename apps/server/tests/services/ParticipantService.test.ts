import { ParticipantService } from "../../src/services/ParticipantService";
import { NotFoundError, ConflictError } from "../../src/utils/errors";
import { Prisma } from "../../src/generated/prisma";

// Mock the DatabaseService

jest.mock("../../src/services/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn().mockReturnValue({
      prisma: {
        participant: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          count: jest.fn(),
        },
      },
    }),
  },
}));

// Now import the service after the mock is set up
import DatabaseService from "../../src/services/database";

describe("ParticipantService", () => {
  let service: ParticipantService;
  let mockDbInstance: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    service = new ParticipantService();
    mockDbInstance = (DatabaseService.getInstance as jest.Mock).mock.results[0]
      .value;
  });

  describe("createParticipant", () => {
    it("should create a new participant", async () => {
      const participantData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const mockParticipant = {
        id: "test-id",
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDbInstance.prisma.participant.findUnique.mockResolvedValue(null); // No existing participant
      mockDbInstance.prisma.participant.create.mockResolvedValue(
        mockParticipant,
      );

      const result = await service.createParticipant(participantData);

      expect(mockDbInstance.prisma.participant.findUnique).toHaveBeenCalledWith(
        {
          where: { email: "john@example.com" },
        },
      );
      expect(mockDbInstance.prisma.participant.create).toHaveBeenCalledWith({
        data: participantData,
      });
      expect(result).toEqual({
        id: mockParticipant.id,
        name: mockParticipant.name,
        email: mockParticipant.email,
        createdAt: mockParticipant.createdAt.toISOString(),
        updatedAt: mockParticipant.updatedAt.toISOString(),
      });
    });

    it("should throw ConflictError for duplicate email", async () => {
      const participantData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const existingParticipant = {
        id: "existing-id",
        name: "Existing User",
        email: "john@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDbInstance.prisma.participant.findUnique.mockResolvedValue(
        existingParticipant,
      );

      await expect(service.createParticipant(participantData)).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("getParticipants", () => {
    it("should return paginated participants", async () => {
      const mockParticipants = [
        {
          id: "test-id-1",
          name: "Alice",
          email: "alice@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "test-id-2",
          name: "Bob",
          email: "bob@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDbInstance.prisma.participant.findMany.mockResolvedValue(
        mockParticipants,
      );
      mockDbInstance.prisma.participant.count.mockResolvedValue(3);

      const result = await service.getParticipants(1, 2);

      expect(mockDbInstance.prisma.participant.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 2,
      });
      expect(mockDbInstance.prisma.participant.count).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });
  });

  describe("getParticipantById", () => {
    it("should return participant by ID", async () => {
      const mockParticipant = {
        id: "test-id",
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDbInstance.prisma.participant.findUnique.mockResolvedValue(
        mockParticipant,
      );

      const result = await service.getParticipantById("test-id");

      expect(mockDbInstance.prisma.participant.findUnique).toHaveBeenCalledWith(
        {
          where: { id: "test-id" },
        },
      );
      expect(result).toEqual({
        id: mockParticipant.id,
        name: mockParticipant.name,
        email: mockParticipant.email,
        createdAt: mockParticipant.createdAt.toISOString(),
        updatedAt: mockParticipant.updatedAt.toISOString(),
      });
    });

    it("should throw NotFoundError for non-existent participant", async () => {
      mockDbInstance.prisma.participant.findUnique.mockResolvedValue(null);

      await expect(
        service.getParticipantById("non-existent-id"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateParticipant", () => {
    it("should update participant successfully", async () => {
      const updateData = {
        name: "John Smith",
      };

      const mockUpdatedParticipant = {
        id: "test-id",
        name: "John Smith",
        email: "john@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDbInstance.prisma.participant.findUnique.mockResolvedValue(null); // No duplicate email
      mockDbInstance.prisma.participant.update.mockResolvedValue(
        mockUpdatedParticipant,
      );

      const result = await service.updateParticipant("test-id", updateData);

      expect(mockDbInstance.prisma.participant.update).toHaveBeenCalledWith({
        where: { id: "test-id" },
        data: { name: "John Smith" },
      });
      expect(result.name).toBe("John Smith");
      expect(result.email).toBe("john@example.com");
    });

    it("should throw error when participant not found", async () => {
      const updateData = {
        name: "John Updated",
      };

      const mockError = new Prisma.PrismaClientKnownRequestError(
        "Record to update not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );
      mockDbInstance.prisma.participant.findUnique.mockResolvedValue(null);
      mockDbInstance.prisma.participant.update.mockRejectedValue(mockError);

      await expect(
        service.updateParticipant("non-existent-id", updateData),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteParticipant", () => {
    it("should delete participant successfully", async () => {
      mockDbInstance.prisma.participant.delete.mockResolvedValue({});

      await service.deleteParticipant("test-id");

      expect(mockDbInstance.prisma.participant.delete).toHaveBeenCalledWith({
        where: { id: "test-id" },
      });
    });

    it("should throw error when participant not found", async () => {
      const mockError = new Prisma.PrismaClientKnownRequestError(
        "Record to delete does not exist",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );
      mockDbInstance.prisma.participant.delete.mockRejectedValue(mockError);

      await expect(
        service.deleteParticipant("non-existent-id"),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
