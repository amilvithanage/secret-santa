import { ParticipantService } from '../../src/services/participantService';
import DatabaseService from '../../src/services/database';
import { CreateParticipantRequest, UpdateParticipantRequest } from '@secret-santa/shared-types';
import { Prisma } from '../../src/generated/prisma';

describe('ParticipantService', () => {
  let participantService: ParticipantService;
  let mockPrisma: any;

  beforeEach(() => {
    participantService = new ParticipantService();
    mockPrisma = DatabaseService.getInstance().prisma;
  });

  describe('createParticipant', () => {
    it('should create a participant successfully', async () => {
      const createData: CreateParticipantRequest = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockParticipant = {
        id: 'test-id',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.participant.create.mockResolvedValue(mockParticipant);

      const result = await participantService.createParticipant(createData);

      expect(mockPrisma.participant.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toEqual({
        id: mockParticipant.id,
        name: mockParticipant.name,
        email: mockParticipant.email,
        createdAt: mockParticipant.createdAt.toISOString(),
        updatedAt: mockParticipant.updatedAt.toISOString(),
      });
    });

    it('should throw error for duplicate email', async () => {
      const createData: CreateParticipantRequest = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] }
        }
      );

      mockPrisma.participant.create.mockRejectedValue(mockError);

      await expect(participantService.createParticipant(createData)).rejects.toThrow(
        'A participant with this email already exists'
      );
    });
  });

  describe('getAllParticipants', () => {
    it('should return all participants', async () => {
      const mockParticipants = [
        {
          id: 'test-id-1',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'test-id-2',
          name: 'Jane Doe',
          email: 'jane@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.participant.findMany.mockResolvedValue(mockParticipants);

      const result = await participantService.getAllParticipants();

      expect(mockPrisma.participant.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 100,
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-id-1');
      expect(result[1].id).toBe('test-id-2');
    });

    it('should return participants with custom pagination', async () => {
      const mockParticipants = [
        {
          id: 'test-id-3',
          name: 'Alice Doe',
          email: 'alice@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.participant.findMany.mockResolvedValue(mockParticipants);

      const result = await participantService.getAllParticipants(10, 5);

      expect(mockPrisma.participant.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 5,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-id-3');
    });
  });

  describe('getParticipantById', () => {
    it('should return participant when found', async () => {
      const mockParticipant = {
        id: 'test-id',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.participant.findUnique.mockResolvedValue(mockParticipant);

      const result = await participantService.getParticipantById('test-id');

      expect(mockPrisma.participant.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result?.id).toBe('test-id');
    });

    it('should return null when participant not found', async () => {
      mockPrisma.participant.findUnique.mockResolvedValue(null);

      const result = await participantService.getParticipantById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateParticipant', () => {
    it('should update participant successfully', async () => {
      const updateData: UpdateParticipantRequest = {
        name: 'John Updated',
      };

      const mockUpdatedParticipant = {
        id: 'test-id',
        name: 'John Updated',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.participant.update.mockResolvedValue(mockUpdatedParticipant);

      const result = await participantService.updateParticipant('test-id', updateData);

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { name: 'John Updated' },
      });
      expect(result.name).toBe('John Updated');
    });

    it('should throw error when participant not found', async () => {
      const updateData: UpdateParticipantRequest = {
        name: 'John Updated',
      };

      const mockError = new Prisma.PrismaClientKnownRequestError(
        'Record to update not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0'
        }
      );
      mockPrisma.participant.update.mockRejectedValue(mockError);

      await expect(participantService.updateParticipant('non-existent-id', updateData)).rejects.toThrow(
        'Participant not found'
      );
    });
  });

  describe('deleteParticipant', () => {
    it('should delete participant successfully', async () => {
      mockPrisma.participant.delete.mockResolvedValue({});

      await participantService.deleteParticipant('test-id');

      expect(mockPrisma.participant.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('should throw error when participant not found', async () => {
      const mockError = new Prisma.PrismaClientKnownRequestError(
        'Record to delete does not exist',
        {
          code: 'P2025',
          clientVersion: '5.0.0'
        }
      );
      mockPrisma.participant.delete.mockRejectedValue(mockError);

      await expect(participantService.deleteParticipant('non-existent-id')).rejects.toThrow(
        'Participant not found'
      );
    });
  });

  describe('getParticipantByEmail', () => {
    it('should return participant when found by email', async () => {
      const mockParticipant = {
        id: 'test-id',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.participant.findUnique.mockResolvedValue(mockParticipant);

      const result = await participantService.getParticipantByEmail('john@example.com');

      expect(mockPrisma.participant.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(result?.email).toBe('john@example.com');
    });

    it('should return null when participant not found by email', async () => {
      mockPrisma.participant.findUnique.mockResolvedValue(null);

      const result = await participantService.getParticipantByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});