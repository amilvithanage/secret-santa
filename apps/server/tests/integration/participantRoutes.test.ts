import request from 'supertest';
import express from 'express';
import participantRoutes from '../../src/routes/participantRoutes';
import { CreateParticipantRequest, UpdateParticipantRequest } from '@secret-santa/shared-types';
import DatabaseService from '../../src/services/database';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/participants', participantRoutes);

// Mock successful database operations for integration tests
beforeEach(() => {
  const mockPrisma = DatabaseService.getInstance().prisma as any;

  // Mock successful participant creation
  mockPrisma.participant.create.mockResolvedValue({
    id: 'test-id',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Mock successful participant retrieval
  mockPrisma.participant.findMany.mockResolvedValue([]);
  mockPrisma.participant.findUnique.mockResolvedValue(null);
  mockPrisma.participant.update.mockRejectedValue({ code: 'P2025' });
  mockPrisma.participant.delete.mockRejectedValue({ code: 'P2025' });
});

describe('Participant Routes', () => {
  describe('POST /api/participants', () => {
    it('should create a participant with valid data', async () => {
      const participantData: CreateParticipantRequest = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response = await request(app)
        .post('/api/participants')
        .send(participantData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toBe('Participant created successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        name: 'John Doe',
        // email is missing
      };

      const response = await request(app)
        .post('/api/participants')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.message).toContain('email is required');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/participants')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.message).toContain('email must be a valid email address');
    });

    it('should return 400 for empty name', async () => {
      const invalidData = {
        name: '',
        email: 'john@example.com',
      };

      const response = await request(app)
        .post('/api/participants')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.message).toContain('name is required');
    });
  });

  describe('GET /api/participants', () => {
    it('should return all participants', async () => {
      const response = await request(app)
        .get('/api/participants')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/participants/:id', () => {
    it('should return 404 for non-existent participant', async () => {
      const response = await request(app)
        .get('/api/participants/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Participant not found');
    });
  });

  describe('PUT /api/participants/:id', () => {
    it('should accept valid update data', async () => {
      const updateData: UpdateParticipantRequest = {
        name: 'John Updated',
      };

      // This will fail because participant doesn't exist, but validates the route structure
      const response = await request(app)
        .put('/api/participants/test-id')
        .send(updateData);

      // Should not be a validation error (400 with validation failed message)
      expect(response.body.error).not.toBe('Validation failed');
    });

    it('should return 400 for invalid email in update', async () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const response = await request(app)
        .put('/api/participants/test-id')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.message).toContain('email must be a valid email address');
    });
  });

  describe('DELETE /api/participants/:id', () => {
    it('should return 404 for non-existent participant', async () => {
      const response = await request(app)
        .delete('/api/participants/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Participant not found');
    });
  });
});
