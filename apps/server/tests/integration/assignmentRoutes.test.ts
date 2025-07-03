import request from 'supertest';
import express from 'express';
import assignmentRoutes from '../../src/routes/assignmentRoutes';
import { GiftExchangeStatus } from '../../src/generated/prisma';
import DatabaseService from '../../src/services/database';
import errorHandler from '../../src/middleware/errorHandler';
import { Prisma } from '../../src/generated/prisma';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/assignments', assignmentRoutes);
app.use(errorHandler); // Add error handler middleware

// Mock successful database operations for integration tests
beforeEach(() => {
  const mockPrisma = DatabaseService.getInstance().prisma as any;

  // Mock successful gift exchange lookup for assignment creation
  mockPrisma.giftExchange.findUnique.mockResolvedValue({
    id: 'test-exchange-id',
    name: 'Christmas 2024',
    year: 2024,
    status: 'PARTICIPANTS_ADDED' as GiftExchangeStatus,
    participants: [
      {
        id: 'gep-1',
        participant: {
          id: 'participant-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      {
        id: 'gep-2',
        participant: {
          id: 'participant-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
      },
    ],
    assignments: [],
    exclusionRules: [],
  });

  // Mock successful assignment operations
  mockPrisma.assignment.findMany.mockResolvedValue([
    {
      id: 'assignment-1',
      giftExchangeId: 'test-exchange-id',
      giverId: 'participant-1',
      receiverId: 'participant-2',
      createdAt: new Date(),
      giver: {
        id: 'participant-1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      receiver: {
        id: 'participant-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    },
  ]);

  mockPrisma.assignment.findUnique.mockResolvedValue({
    id: 'assignment-1',
    giftExchangeId: 'test-exchange-id',
    giverId: 'participant-1',
    receiverId: 'participant-2',
    createdAt: new Date(),
    giver: {
      id: 'participant-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    receiver: {
      id: 'participant-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  });

  // Mock transaction for assignment creation
  mockPrisma.$transaction.mockImplementation(async (callback: any) => {
    const mockTx = {
      assignment: {
        create: jest.fn().mockResolvedValue({
          id: 'assignment-1',
          giftExchangeId: 'test-exchange-id',
          giverId: 'participant-1',
          receiverId: 'participant-2',
          createdAt: new Date(),
          giver: {
            id: 'participant-1',
            name: 'John Doe',
            email: 'john@example.com',
          },
          receiver: {
            id: 'participant-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
          },
        }),
        deleteMany: jest.fn(),
      },
      giftExchange: {
        update: jest.fn(),
      },
    };
    return await callback(mockTx);
  });

  // Mock Prisma errors for error scenarios
  const mockNotFoundError = new Prisma.PrismaClientKnownRequestError(
    'Record to update not found',
    {
      code: 'P2025',
      clientVersion: '5.0.0'
    }
  );

  // Store error mocks for later use
  (mockPrisma as any).__mockNotFoundError = mockNotFoundError;
});

describe('Assignment Routes', () => {
  describe('POST /api/assignments/:id/assign', () => {
    it('should create assignments for a gift exchange', async () => {
      const response = await request(app)
        .post('/api/assignments/test-exchange-id/assign')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.message).toBe('Secret Santa assignments created successfully');
    });

    it('should return 404 when gift exchange not found', async () => {
      const mockPrisma = DatabaseService.getInstance().prisma as any;
      mockPrisma.giftExchange.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/assignments/non-existent-id/assign')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Gift exchange not found');
    });

    it('should return 400 when gift exchange has insufficient participants', async () => {
      const mockPrisma = DatabaseService.getInstance().prisma as any;
      mockPrisma.giftExchange.findUnique.mockResolvedValueOnce({
        id: 'test-exchange-id',
        participants: [
          {
            id: 'gep-1',
            participant: {
              id: 'participant-1',
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
        ],
        assignments: [],
        exclusionRules: [],
      });

      const response = await request(app)
        .post('/api/assignments/test-exchange-id/assign')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.message).toBe('Gift exchange must have at least 2 participants');
    });

    it('should return 400 when assignments already exist', async () => {
      const mockPrisma = DatabaseService.getInstance().prisma as any;
      mockPrisma.giftExchange.findUnique.mockResolvedValueOnce({
        id: 'test-exchange-id',
        participants: [
          {
            id: 'gep-1',
            participant: {
              id: 'participant-1',
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
          {
            id: 'gep-2',
            participant: {
              id: 'participant-2',
              name: 'Jane Smith',
              email: 'jane@example.com',
            },
          },
        ],
        assignments: [{ id: 'existing-assignment' }],
        exclusionRules: [],
      });

      const response = await request(app)
        .post('/api/assignments/test-exchange-id/assign')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.message).toBe('Assignments already exist for this gift exchange');
    });
  });

  describe('GET /api/assignments', () => {
    it('should return all assignments', async () => {
      const response = await request(app)
        .get('/api/assignments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('giver');
      expect(response.body.data[0]).toHaveProperty('receiver');
    });

    it('should return empty array when no assignments exist', async () => {
      const mockPrisma = DatabaseService.getInstance().prisma as any;
      mockPrisma.assignment.findMany.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/assignments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/assignments/:id', () => {
    it('should return assignment by ID', async () => {
      const response = await request(app)
        .get('/api/assignments/assignment-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('assignment-1');
      expect(response.body.data).toHaveProperty('giver');
      expect(response.body.data).toHaveProperty('receiver');
    });

    it('should return 404 when assignment not found', async () => {
      const mockPrisma = DatabaseService.getInstance().prisma as any;
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/assignments/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Assignment not found');
    });
  });

  describe('GET /api/assignments/:id/assignments', () => {
    it('should return assignments for a gift exchange', async () => {
      const response = await request(app)
        .get('/api/assignments/test-exchange-id/assignments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].giftExchangeId).toBe('test-exchange-id');
    });

    it('should return empty array when no assignments exist for exchange', async () => {
      const mockPrisma = DatabaseService.getInstance().prisma as any;
      mockPrisma.assignment.findMany.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/assignments/test-exchange-id/assignments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('DELETE /api/assignments/:id/assignments', () => {
    it('should delete all assignments for a gift exchange', async () => {
      const response = await request(app)
        .delete('/api/assignments/test-exchange-id/assignments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All assignments deleted successfully');
    });

    it('should return 404 when gift exchange not found', async () => {
      const mockPrisma = DatabaseService.getInstance().prisma as any;
      mockPrisma.$transaction.mockRejectedValueOnce((mockPrisma as any).__mockNotFoundError);

      const response = await request(app)
        .delete('/api/assignments/non-existent-id/assignments')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Gift exchange not found');
    });
  });
});
