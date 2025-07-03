import { PrismaClient } from '../src/generated/prisma';

// Mock Prisma Client for tests
jest.mock('../src/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    participant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    giftExchange: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    giftExchangeParticipant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    assignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    exclusionRule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
  })),
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      meta?: Record<string, unknown>;
      clientVersion: string;
      batchRequestIdx?: number;
      constructor(message: string, { code, clientVersion, meta, batchRequestIdx }: { code: string; clientVersion: string; meta?: Record<string, unknown>; batchRequestIdx?: number }) {
        super(message);
        this.name = 'PrismaClientKnownRequestError';
        this.code = code;
        this.clientVersion = clientVersion;
        this.meta = meta;
        this.batchRequestIdx = batchRequestIdx;
      }
    },
  },
}));

// Global test setup
beforeAll(async () => {
  // Setup test environment
});

afterAll(async () => {
  // Cleanup test environment
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});