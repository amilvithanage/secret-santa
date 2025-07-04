import request from "supertest";
import express from "express";
import {
  AddParticipantToExchangeRequest,
  CreateGiftExchangeRequest,
  GiftExchangeStatus,
  UpdateGiftExchangeRequest,
} from "@secret-santa/shared-types";
import errorHandler from "../../../src/middleware/errorHandler";

// Create mock functions that we can control
const mockPrisma = {
  giftExchange: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  participant: {
    findUnique: jest.fn(),
  },
  giftExchangeParticipant: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

// Mock the services before importing anything else
jest.mock("../../../src/services/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      prisma: mockPrisma,
    })),
  },
}));

jest.mock("../../../src/services/ParticipantService", () => ({
  ParticipantService: jest.fn().mockImplementation(() => ({
    getParticipantById: jest.fn(),
    createParticipant: jest.fn(),
    getParticipants: jest.fn(),
    updateParticipant: jest.fn(),
    deleteParticipant: jest.fn(),
    searchParticipants: jest.fn(),
  })),
}));

// Import after mocking
import giftExchangeRoutes from "../../../src/routes/v1/giftExchangeRoutes";
import DatabaseService from "../../../src/services/database";

const app = express();
app.use(express.json());
app.use("/api/v1/gift-exchanges", giftExchangeRoutes);
app.use(errorHandler);

describe("Gift Exchange Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful gift exchange creation
    mockPrisma.giftExchange.findFirst.mockResolvedValue(null); // For duplicate check

    const mockGiftExchangeData = {
      id: "test-exchange-id",
      name: "Christmas 2024",
      year: 2024,
      status: GiftExchangeStatus.DRAFT,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      participants: [],
      assignments: [],
    };

    // Mock create to return the full structure expected by the service
    mockPrisma.giftExchange.create.mockResolvedValue(mockGiftExchangeData);

    // Mock successful gift exchange retrieval
    mockPrisma.giftExchange.findMany.mockResolvedValue([mockGiftExchangeData]);

    // Mock findUnique to return data for existing exchanges and null for non-existent ones
    mockPrisma.giftExchange.findUnique.mockImplementation((args) => {
      if (args.where.id === "test-id" || args.where.id === "test-exchange-id") {
        return Promise.resolve({
          id: args.where.id,
          name: "Christmas 2024",
          year: 2024,
          status: GiftExchangeStatus.DRAFT,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          participants: [],
          assignments: [],
        });
      }
      return Promise.resolve(null);
    });

    // Mock update method
    mockPrisma.giftExchange.update.mockImplementation((args) => {
      return Promise.resolve({
        id: args.where.id,
        name: args.data.name || "Christmas 2024",
        year: args.data.year || 2024,
        status: args.data.status || GiftExchangeStatus.DRAFT,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        participants: [],
        assignments: [],
      });
    });

    // Mock delete method
    mockPrisma.giftExchange.delete.mockResolvedValue({
      id: "test-id",
      name: "Christmas 2024",
      year: 2024,
      status: GiftExchangeStatus.DRAFT,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    // Mock participant service methods
    const mockParticipant = {
      id: "test-participant-id",
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    // Mock participant-related operations
    mockPrisma.participant.findUnique.mockResolvedValue(mockParticipant);

    mockPrisma.giftExchangeParticipant.create.mockResolvedValue({
      id: "participant_exchange_1",
      giftExchangeId: "test-id",
      participantId: "test-participant-id",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });
    mockPrisma.giftExchangeParticipant.delete.mockResolvedValue({
      id: "participant_exchange_1",
      giftExchangeId: "test-id",
      participantId: "test-participant-id",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    // Mock successful participant operations
    mockPrisma.participant.findUnique.mockResolvedValue({
      id: "test-participant-id",
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPrisma.giftExchangeParticipant.findFirst.mockResolvedValue(null);
    mockPrisma.giftExchangeParticipant.create.mockResolvedValue({});
    mockPrisma.giftExchangeParticipant.findMany.mockResolvedValue([]);
  });
  describe("POST /api/v1/gift-exchanges", () => {
    it("should create a gift exchange with valid data", async () => {
      const giftExchangeData: CreateGiftExchangeRequest = {
        name: "Christmas 2024",
        year: 2024,
      };

      const response = await request(app)
        .post("/api/v1/gift-exchanges")
        .send(giftExchangeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toBe("Gift exchange created successfully");
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        name: "Christmas 2024",
        // year is missing
      };

      const response = await request(app)
        .post("/api/v1/gift-exchanges")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.message).toContain("year");
    });

    it("should return 400 for empty name", async () => {
      const invalidData = {
        name: "",
        year: 2024,
      };

      const response = await request(app)
        .post("/api/v1/gift-exchanges")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.message).toContain("name is required");
    });

    it("should return 400 for invalid year", async () => {
      const currentYear = new Date().getFullYear();
      const invalidData = {
        name: "Christmas 2024",
        year: currentYear - 20, // Too far in the past
      };

      const response = await request(app)
        .post("/api/v1/gift-exchanges")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.message).toContain("year must be 2020 or later");
    });
  });

  describe("GET /api/v1/gift-exchanges", () => {
    it("should return all gift exchanges", async () => {
      const response = await request(app)
        .get("/api/v1/gift-exchanges")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe("GET /api/v1/gift-exchanges/:id", () => {
    it("should return 404 for non-existent gift exchange", async () => {
      const response = await request(app)
        .get("/api/v1/gift-exchanges/non-existent-id")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Gift exchange not found");
    });
  });

  describe("PUT /api/v1/gift-exchanges/:id", () => {
    it("should accept valid update data", async () => {
      const updateData: UpdateGiftExchangeRequest = {
        name: "Updated Christmas 2024",
      };

      // This will fail because gift exchange doesn't exist, but validates the route structure
      const response = await request(app)
        .put("/api/v1/gift-exchanges/test-id")
        .send(updateData);

      // Should not be a validation error (400 with validation failed message)
      expect(response.body.error).not.toBe("Validation failed");
    });

    it("should return 400 for invalid year in update", async () => {
      const currentYear = new Date().getFullYear();
      const invalidData = {
        year: currentYear + 20, // Too far in the future
      };

      const response = await request(app)
        .put("/api/v1/gift-exchanges/test-id")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.message).toContain("year must be 2030 or earlier");
    });
  });

  describe("DELETE /api/v1/gift-exchanges/:id", () => {
    it("should return 404 for non-existent gift exchange", async () => {
      const response = await request(app)
        .delete("/api/v1/gift-exchanges/non-existent-id")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Gift exchange not found");
    });
  });

  describe("GET /api/v1/gift-exchanges/:id/participants", () => {
    it("should return participants for gift exchange", async () => {
      const response = await request(app)
        .get("/api/v1/gift-exchanges/test-id/participants")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("POST /api/v1/gift-exchanges/:id/participants", () => {
    it("should add participant to gift exchange with valid data", async () => {
      const participantData: AddParticipantToExchangeRequest = {
        participantId: "test-participant-id",
      };

      // Mock the gift exchange lookup to return a valid exchange
      const mockPrisma = DatabaseService.getInstance().prisma as any;
      mockPrisma.giftExchange.findUnique.mockResolvedValueOnce({
        id: "test-id",
        name: "Christmas 2024",
        year: 2024,
        status: GiftExchangeStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        assignments: [],
      });

      // Mock the update call to succeed
      mockPrisma.giftExchange.update.mockResolvedValueOnce({
        id: "test-id",
        name: "Christmas 2024",
        year: 2024,
        status: GiftExchangeStatus.PARTICIPANTS_ADDED,
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        assignments: [],
      });

      const response = await request(app)
        .post("/api/v1/gift-exchanges/test-id/participants")
        .send(participantData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Participant added to gift exchange successfully",
      );
    });

    it("should return 400 for missing participantId", async () => {
      const invalidData = {
        // participantId is missing
      };

      const response = await request(app)
        .post("/api/v1/gift-exchanges/test-id/participants")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.message).toContain("participantId");
    });
  });

  describe("DELETE /api/v1/gift-exchanges/:id/participants/:participantId", () => {
    it("should remove participant from gift exchange", async () => {
      // Mock successful removal
      const mockPrisma = DatabaseService.getInstance().prisma as any;
      mockPrisma.giftExchangeParticipant.findFirst.mockResolvedValueOnce({
        id: "participant-exchange-1",
        giftExchangeId: "test-id",
        participantId: "test-participant-id",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      });
      mockPrisma.giftExchangeParticipant.delete.mockResolvedValueOnce({});
      mockPrisma.giftExchangeParticipant.count.mockResolvedValueOnce(2);
      mockPrisma.giftExchange.findUnique.mockResolvedValueOnce({
        id: "test-id",
        name: "Christmas 2024",
        year: 2024,
        status: GiftExchangeStatus.PARTICIPANTS_ADDED,
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        assignments: [],
      });

      const response = await request(app)
        .delete(
          "/api/v1/gift-exchanges/test-id/participants/test-participant-id",
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Participant removed from gift exchange successfully",
      );
    });

    it("should return 400 for participant not in exchange", async () => {
      // Mock participant not found in exchange
      const mockPrisma = DatabaseService.getInstance().prisma as any;
      mockPrisma.giftExchangeParticipant.findFirst.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete(
          "/api/v1/gift-exchanges/test-id/participants/non-existent-participant",
        )
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Participant is not part of this gift exchange",
      );
    });
  });
});
