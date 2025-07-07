import { GiftExchangeService } from "../../src/services/giftExchangeService";
import { ParticipantService } from "../../src/services/ParticipantService";
import { ConflictError, ValidationError } from "../../src/utils/errors";
import { GiftExchangeStatus } from "@secret-santa/shared-types";

// Mock the DatabaseService
const mockPrisma = {
  giftExchange: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  giftExchangeParticipant: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  participant: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock ParticipantService
const mockParticipantService = {
  createParticipant: jest.fn(),
};

jest.mock("../../src/services/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      prisma: mockPrisma,
    })),
  },
}));

jest.mock("../../src/services/ParticipantService", () => ({
  ParticipantService: jest
    .fn()
    .mockImplementation(() => mockParticipantService),
}));

describe("GiftExchangeService", () => {
  let giftExchangeService: GiftExchangeService;
  let participantService: ParticipantService;

  beforeEach(async () => {
    jest.clearAllMocks();
    giftExchangeService = new GiftExchangeService();
    participantService = new ParticipantService();
  });

  describe("createGiftExchange", () => {
    it("should create a new gift exchange", async () => {
      const exchangeData = {
        name: "Office Christmas 2024",
        year: 2024,
      };

      const mockCreatedExchange = {
        id: "test-id",
        name: "Office Christmas 2024",
        year: 2024,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.giftExchange.findFirst.mockResolvedValue(null);
      mockPrisma.giftExchange.create.mockResolvedValue(mockCreatedExchange);

      const result = await giftExchangeService.createGiftExchange(exchangeData);

      expect(result).toMatchObject({
        name: "Office Christmas 2024",
        year: 2024,
        status: "DRAFT",
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should throw ConflictError for duplicate name/year", async () => {
      const exchangeData = {
        name: "Office Christmas 2024",
        year: 2024,
      };

      const existingExchange = {
        id: "existing-id",
        name: "Office Christmas 2024",
        year: 2024,
        status: "DRAFT",
      };

      mockPrisma.giftExchange.findFirst.mockResolvedValue(existingExchange);

      await expect(
        giftExchangeService.createGiftExchange(exchangeData),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("getGiftExchanges", () => {
    it("should return paginated gift exchanges", async () => {
      const mockExchanges = [
        {
          id: "exchange-1",
          name: "Christmas 2024",
          year: 2024,
          status: "DRAFT",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "exchange-2",
          name: "New Year 2025",
          year: 2025,
          status: "DRAFT",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.giftExchange.findMany.mockResolvedValue(mockExchanges);
      mockPrisma.giftExchange.count.mockResolvedValue(2);

      const result = await giftExchangeService.getGiftExchanges(1, 10);

      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });
  });

  describe("addParticipantToExchange", () => {
    it.skip("should add participant to exchange", async () => {
      const mockExchange = {
        id: "exchange-1",
        name: "Test Exchange",
        year: 2024,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockParticipant = {
        id: "participant-1",
        name: "John Doe",
        email: "john@example.com",
      };

      const mockGiftExchangeParticipant = {
        id: "gep-1",
        giftExchangeId: "exchange-1",
        participantId: "participant-1",
        participant: mockParticipant,
      };

      // Mock the Prisma calls properly - use mockImplementation to handle multiple calls
      mockPrisma.giftExchange.findUnique.mockImplementation((args) => {
        if (args.where.id === "exchange-1") {
          return Promise.resolve(mockExchange);
        }
        return Promise.resolve(null);
      });
      mockPrisma.participant.findUnique.mockResolvedValue(mockParticipant);
      mockPrisma.giftExchangeParticipant.findFirst.mockResolvedValue(null);
      mockPrisma.giftExchangeParticipant.create.mockResolvedValue(
        mockGiftExchangeParticipant,
      );

      await expect(
        giftExchangeService.addParticipantToExchange("exchange-1", {
          participantId: "participant-1",
        }),
      ).resolves.not.toThrow();
    });

    it("should throw ConflictError for duplicate participant", async () => {
      const mockExchange = {
        id: "exchange-1",
        name: "Test Exchange",
        year: 2024,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockParticipant = {
        id: "participant-1",
        name: "John Doe",
        email: "john@example.com",
      };

      const existingGiftExchangeParticipant = {
        id: "gep-1",
        giftExchangeId: "exchange-1",
        participantId: "participant-1",
      };

      mockPrisma.giftExchange.findUnique.mockResolvedValue(mockExchange);
      mockPrisma.participant.findUnique.mockResolvedValue(mockParticipant);
      mockPrisma.giftExchangeParticipant.findFirst.mockResolvedValue(
        existingGiftExchangeParticipant,
      );

      await expect(
        giftExchangeService.addParticipantToExchange("exchange-1", {
          participantId: "participant-1",
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("updateGiftExchange", () => {
    it("should update gift exchange status", async () => {
      const mockExchange = {
        id: "exchange-1",
        name: "Test Exchange",
        year: 2024,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedExchange = {
        ...mockExchange,
        status: "PARTICIPANTS_ADDED",
        updatedAt: new Date(),
      };

      mockPrisma.giftExchange.findUnique.mockResolvedValue(mockExchange);
      mockPrisma.giftExchange.update.mockResolvedValue(updatedExchange);

      const result = await giftExchangeService.updateGiftExchange(
        "exchange-1",
        {
          status: GiftExchangeStatus.PARTICIPANTS_ADDED,
        },
      );

      expect(result.status).toBe("PARTICIPANTS_ADDED");
    });

    it("should throw BusinessLogicError for invalid status transition", async () => {
      const mockExchange = {
        id: "exchange-1",
        name: "Test Exchange",
        year: 2024,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.giftExchange.findUnique.mockResolvedValue(mockExchange);

      // Try invalid transition from DRAFT to ASSIGNED
      await expect(
        giftExchangeService.updateGiftExchange("exchange-1", {
          status: GiftExchangeStatus.ASSIGNED,
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("deleteGiftExchange", () => {
    it("should delete gift exchange in DRAFT status", async () => {
      const mockExchange = {
        id: "exchange-1",
        name: "Test Exchange",
        year: 2024,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.giftExchange.findUnique.mockResolvedValue(mockExchange);
      mockPrisma.giftExchange.delete.mockResolvedValue(mockExchange);

      await expect(
        giftExchangeService.deleteGiftExchange("exchange-1"),
      ).resolves.not.toThrow();
    });

    it("should throw ValidationError for deleting exchange with assignments", async () => {
      const mockExchange = {
        id: "exchange-1",
        name: "Test Exchange",
        year: 2024,
        status: "ASSIGNED",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.giftExchange.findUnique.mockResolvedValue(mockExchange);

      await expect(
        giftExchangeService.deleteGiftExchange("exchange-1"),
      ).rejects.toThrow(ValidationError);
    });
  });
});
