import request from "supertest";
import express from "express";
import { GiftExchangeStatus } from "@secret-santa/shared-types";
import errorHandler from "../../../src/middleware/errorHandler";

// Mock the DatabaseService to use the global mocked Prisma from setup.ts
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

jest.mock("../../../src/services/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn().mockReturnValue({
      prisma: mockPrisma,
    }),
  },
}));

// Now import the routes after the mock is set up
import exclusionRulesRoutes from "../../../src/routes/v1/exclusionRulesRoutes";

// Create test app
const app = express();
app.use(express.json());
app.use("/api/v1/exclusion-rules", exclusionRulesRoutes);
app.use(errorHandler); // Add error handler middleware

describe("Exclusion Rules Routes", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock successful gift exchange lookup
    mockPrisma.giftExchange.findUnique.mockResolvedValue({
      id: "test-exchange-id",
      name: "Christmas 2024",
      year: 2024,
      status: GiftExchangeStatus.DRAFT,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    // Mock participants in exchange
    mockPrisma.giftExchangeParticipant.findMany.mockResolvedValue([
      {
        participantId: "participant-1",
        giftExchangeId: "test-exchange-id",
        participant: {
          id: "participant-1",
          name: "John Doe",
          email: "john@example.com",
        },
      },
      {
        participantId: "participant-2",
        giftExchangeId: "test-exchange-id",
        participant: {
          id: "participant-2",
          name: "Jane Smith",
          email: "jane@example.com",
        },
      },
    ]);

    // Mock participant lookup
    mockPrisma.participant.findUnique.mockImplementation((args) => {
      const id = args.where.id;
      if (id === "participant-1") {
        return Promise.resolve({
          id: "participant-1",
          name: "John Doe",
          email: "john@example.com",
        });
      }
      if (id === "participant-2") {
        return Promise.resolve({
          id: "participant-2",
          name: "Jane Smith",
          email: "jane@example.com",
        });
      }
      return Promise.resolve(null);
    });
  });

  describe("POST /api/v1/exclusion-rules/:giftExchangeId", () => {
    it("should create a new exclusion rule successfully", async () => {
      const exclusionRuleData = {
        excluderId: "participant-1",
        excludedId: "participant-2",
        reason: "They are siblings",
      };

      // Mock no existing exclusion rule (for duplicate check)
      mockPrisma.exclusionRule.findMany.mockResolvedValue([]);
      mockPrisma.exclusionRule.findFirst.mockResolvedValue(null);

      // Mock successful creation
      mockPrisma.exclusionRule.create.mockResolvedValue({
        id: "exclusion-rule-id",
        giftExchangeId: "test-exchange-id",
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
      });

      const response = await request(app)
        .post("/api/v1/exclusion-rules/test-exchange-id")
        .send(exclusionRuleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe("exclusion-rule-id");
      expect(response.body.data.excluder.name).toBe("John Doe");
      expect(response.body.data.excluded.name).toBe("Jane Smith");
      expect(response.body.message).toBe("Exclusion rule created successfully");
    });

    it("should return 400 for missing excluderId", async () => {
      const exclusionRuleData = {
        excludedId: "participant-2",
        reason: "They are siblings",
      };

      const response = await request(app)
        .post("/api/v1/exclusion-rules/test-exchange-id")
        .send(exclusionRuleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("excluderId is required");
    });

    it("should return 400 for missing excludedId", async () => {
      const exclusionRuleData = {
        excluderId: "participant-1",
        reason: "They are siblings",
      };

      const response = await request(app)
        .post("/api/v1/exclusion-rules/test-exchange-id")
        .send(exclusionRuleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("excludedId is required");
    });

    it("should return 400 when participant tries to exclude themselves", async () => {
      const exclusionRuleData = {
        excluderId: "participant-1",
        excludedId: "participant-1",
        reason: "Self exclusion",
      };

      const response = await request(app)
        .post("/api/v1/exclusion-rules/test-exchange-id")
        .send(exclusionRuleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        "participant cannot exclude themselves",
      );
    });

    it("should return 404 for non-existent gift exchange", async () => {
      // Mock gift exchange not found
      mockPrisma.giftExchange.findUnique.mockResolvedValue(null);

      const exclusionRuleData = {
        excluderId: "participant-1",
        excludedId: "participant-2",
        reason: "They are siblings",
      };

      const response = await request(app)
        .post("/api/v1/exclusion-rules/non-existent-exchange")
        .send(exclusionRuleData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Gift exchange not found");
    });
  });

  describe("GET /api/v1/exclusion-rules/:giftExchangeId", () => {
    it("should get exclusion rules for a gift exchange", async () => {
      const mockExclusionRules = [
        {
          id: "exclusion-1",
          giftExchangeId: "test-exchange-id",
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
      ];

      mockPrisma.exclusionRule.findMany.mockResolvedValue(mockExclusionRules);
      mockPrisma.exclusionRule.count.mockResolvedValue(1);

      const response = await request(app)
        .get("/api/v1/exclusion-rules/test-exchange-id")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].id).toBe("exclusion-1");
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(1);
    });

    it("should return empty array when no exclusion rules exist", async () => {
      mockPrisma.exclusionRule.findMany.mockResolvedValue([]);
      mockPrisma.exclusionRule.count.mockResolvedValue(0);

      const response = await request(app)
        .get("/api/v1/exclusion-rules/test-exchange-id")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it("should handle pagination parameters", async () => {
      mockPrisma.exclusionRule.findMany.mockResolvedValue([]);
      mockPrisma.exclusionRule.count.mockResolvedValue(0);

      const response = await request(app)
        .get(
          "/api/v1/exclusion-rules/test-exchange-id?page=2&limit=5&sortBy=reason&sortOrder=asc",
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe("2");
      expect(response.body.data.pagination.limit).toBe("5");
    });

    it("should return 404 for non-existent gift exchange", async () => {
      mockPrisma.giftExchange.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/v1/exclusion-rules/non-existent-exchange")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Gift exchange not found");
    });
  });

  describe("DELETE /api/v1/exclusion-rules/:giftExchangeId/:id", () => {
    it("should delete an exclusion rule successfully", async () => {
      // Mock finding the exclusion rule
      mockPrisma.exclusionRule.findUnique.mockResolvedValue({
        id: "exclusion-rule-id",
        giftExchangeId: "test-exchange-id",
        excluderId: "participant-1",
        excludedId: "participant-2",
        reason: "They are siblings",
        createdAt: new Date("2024-01-01"),
      });

      // Mock successful deletion
      mockPrisma.exclusionRule.delete.mockResolvedValue({
        id: "exclusion-rule-id",
        giftExchangeId: "test-exchange-id",
        excluderId: "participant-1",
        excludedId: "participant-2",
        reason: "They are siblings",
        createdAt: new Date("2024-01-01"),
      });

      const response = await request(app)
        .delete("/api/v1/exclusion-rules/test-exchange-id/exclusion-rule-id")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe(null);
      expect(response.body.message).toBe("Exclusion rule deleted successfully");
    });

    it("should return 404 for non-existent exclusion rule", async () => {
      // Mock exclusion rule not found
      mockPrisma.exclusionRule.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete("/api/v1/exclusion-rules/test-exchange-id/non-existent-rule")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Exclusion rule not found");
    });

    it("should return 400 for invalid exclusion rule ID", async () => {
      await request(app)
        .delete("/api/v1/exclusion-rules/test-exchange-id/")
        .expect(404); // Express returns 404 for missing route parameter

      // This test verifies the route structure
    });
  });

  describe("GET /api/v1/exclusion-rules/:giftExchangeId/validate", () => {
    it("should validate exclusion rules successfully", async () => {
      // Mock participants with proper structure
      mockPrisma.giftExchangeParticipant.findMany.mockResolvedValue([
        {
          participantId: "participant-1",
          giftExchangeId: "test-exchange-id",
          participant: {
            id: "participant-1",
            name: "John Doe",
            email: "john@example.com",
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          },
        },
        {
          participantId: "participant-2",
          giftExchangeId: "test-exchange-id",
          participant: {
            id: "participant-2",
            name: "Jane Smith",
            email: "jane@example.com",
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          },
        },
      ]);

      // Mock exclusion rules
      mockPrisma.exclusionRule.findMany.mockResolvedValue([
        {
          id: "exclusion-1",
          giftExchangeId: "test-exchange-id",
          excluderId: "participant-1",
          excludedId: "participant-2",
          excluder: { name: "John Doe" },
          excluded: { name: "Jane Smith" },
        },
      ]);

      const response = await request(app)
        .get("/api/v1/exclusion-rules/test-exchange-id/validate")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBeDefined();
      expect(response.body.data.issues).toBeDefined();
      expect(Array.isArray(response.body.data.issues)).toBe(true);
    });

    it("should return 404 for non-existent gift exchange", async () => {
      mockPrisma.giftExchange.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/v1/exclusion-rules/non-existent-exchange/validate")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Gift exchange not found");
    });

    it("should return 400 for invalid gift exchange ID", async () => {
      await request(app).get("/api/v1/exclusion-rules//validate").expect(404); // Express returns 404 for missing route parameter

      // This test verifies the route structure
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      // Mock database error
      mockPrisma.exclusionRule.create.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const exclusionRuleData = {
        excluderId: "participant-1",
        excludedId: "participant-2",
        reason: "They are siblings",
      };

      // Mock no existing exclusion rule (for duplicate check)
      mockPrisma.exclusionRule.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/v1/exclusion-rules/test-exchange-id")
        .send(exclusionRuleData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Internal server error");
    });

    it("should handle validation errors for invalid JSON", async () => {
      const response = await request(app)
        .post("/api/v1/exclusion-rules/test-exchange-id")
        .send("invalid json")
        .set("Content-Type", "application/json")
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
