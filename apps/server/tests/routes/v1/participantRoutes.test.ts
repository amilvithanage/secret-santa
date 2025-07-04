import request from "supertest";
import express from "express";
import {
  CreateParticipantRequest,
  UpdateParticipantRequest,
} from "@secret-santa/shared-types";
import errorHandler from "../../../src/middleware/errorHandler";
import { Prisma } from "../../../src/generated/prisma";

// Mock the DatabaseService to use the global mocked Prisma from setup.ts
const mockPrisma = {
  participant: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
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
import participantRoutes from "../../../src/routes/v1/participantRoutes";
import DatabaseService from "../../../src/services/database";

// Create test app
const app = express();
app.use(express.json());
app.use("/api/v1/participants", participantRoutes);
app.use(errorHandler); // Add error handler middleware

// Mock successful database operations for integration tests
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();

  // Set up default mock return values
  mockPrisma.participant.create.mockResolvedValue({
    id: "test-id",
    name: "John Doe",
    email: "john@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  mockPrisma.participant.findMany.mockResolvedValue([]);
  mockPrisma.participant.findUnique.mockResolvedValue(null);
  mockPrisma.participant.count.mockResolvedValue(0);
  mockPrisma.participant.update.mockResolvedValue({
    id: "test-id",
    name: "Updated Name",
    email: "updated@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  mockPrisma.participant.delete.mockResolvedValue({});
});

describe("Participant Routes", () => {
  describe("POST /api/v1/participants", () => {
    it("should create a participant with valid data", async () => {
      const participantData: CreateParticipantRequest = {
        name: "John Doe",
        email: "john@example.com",
      };

      const response = await request(app)
        .post("/api/v1/participants")
        .send(participantData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toBe("Participant created successfully");
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        name: "John Doe",
        // email is missing
      };

      const response = await request(app)
        .post("/api/v1/participants")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.message).toContain("email is required");
    });

    it("should return 400 for invalid email format", async () => {
      const invalidData = {
        name: "John Doe",
        email: "invalid-email",
      };

      const response = await request(app)
        .post("/api/v1/participants")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.message).toContain(
        "email must be a valid email address",
      );
    });

    it("should return 400 for empty name", async () => {
      const invalidData = {
        name: "",
        email: "john@example.com",
      };

      const response = await request(app)
        .post("/api/v1/participants")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.message).toContain("name is required");
    });
  });

  describe("GET /api/v1/participants", () => {
    it("should return all participants", async () => {
      const response = await request(app)
        .get("/api/v1/participants")
        .expect(200);

      expect(response.body.success).toBe(true);
      // The response should have a data property that contains the participants array
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe("GET /api/v1/participants/:id", () => {
    it("should return 404 for non-existent participant", async () => {
      const response = await request(app)
        .get("/api/v1/participants/non-existent-id")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Participant not found");
    });
  });

  describe("PUT /api/v1/participants/:id", () => {
    it("should accept valid update data", async () => {
      const updateData: UpdateParticipantRequest = {
        name: "John Updated",
      };

      // This will fail because participant doesn't exist, but validates the route structure
      const response = await request(app)
        .put("/api/v1/participants/test-id")
        .send(updateData);

      // Should not be a validation error (400 with validation failed message)
      expect(response.body.error).not.toBe("Validation failed");
    });

    it("should return 400 for invalid email in update", async () => {
      const invalidData = {
        email: "invalid-email",
      };

      const response = await request(app)
        .put("/api/v1/participants/test-id")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.message).toContain(
        "email must be a valid email address",
      );
    });
  });

  describe("DELETE /api/v1/participants/:id", () => {
    it("should return 404 for non-existent participant", async () => {
      // Mock the delete to throw a Prisma error for non-existent record
      const mockError = new Prisma.PrismaClientKnownRequestError(
        "Record to delete does not exist",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );
      mockPrisma.participant.delete.mockRejectedValue(mockError);

      const response = await request(app)
        .delete("/api/v1/participants/non-existent-id")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Participant not found");
    });
  });
});
