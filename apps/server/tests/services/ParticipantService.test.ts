import { CreateParticipantRequest, UpdateParticipantRequest } from '@secret-santa/shared-types';
import { Prisma } from '../../src/generated/prisma';

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

jest.mock('../../src/services/database', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn().mockReturnValue({
      prisma: mockPrisma,
    }),
  },
}));

// Now import the service after the mock is set up
import { ParticipantService } from '../../src/services/ParticipantService';

describe('ParticipantService', () => {
  let participantService: ParticipantService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    participantService = new ParticipantService();
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

      const existingParticipant = {
        id: 'existing-id',
        name: 'Existing User',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.participant.findUnique.mockResolvedValue(existingParticipant);

      await expect(participantService.createParticipant(createData)).rejects.toThrow(
        'A participant with this email already exists'
      );
    });
  });

  describe('getParticipants', () => {
    it('should return paginated participants', async () => {
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
      mockPrisma.participant.count.mockResolvedValue(2);

      const result = await participantService.getParticipants();

      expect(mockPrisma.participant.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(mockPrisma.participant.count).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('test-id-1');
      expect(result.data[1].id).toBe('test-id-2');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
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
      mockPrisma.participant.count.mockResolvedValue(1);

      const result = await participantService.getParticipants(2, 5);

      expect(mockPrisma.participant.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
      });
      expect(mockPrisma.participant.count).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('test-id-3');
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 1,
        totalPages: 1,
      });
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

    it('should throw NotFoundError when participant not found', async () => {
      mockPrisma.participant.findUnique.mockResolvedValue(null);

      await expect(participantService.getParticipantById('non-existent-id')).rejects.toThrow(
        'Participant not found'
      );
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


});