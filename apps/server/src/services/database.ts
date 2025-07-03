import { PrismaClient } from '../generated/prisma';
import { withAccelerate } from '@prisma/extension-accelerate';

class DatabaseService {
  private static instance: DatabaseService;
  public prisma: any; // Using any for Accelerate extended client
  private isConnected: boolean = false;

  private constructor() {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    // Use Accelerate extension only if the database URL uses Prisma Accelerate
    if (process.env.DATABASE_URL?.includes('prisma+postgres://')) {
      this.prisma = client.$extends(withAccelerate());
    } else {
      this.prisma = client;
    }

    // Note: Graceful shutdown is handled in server.ts
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('✅ Database already connected');
      return;
    }

    try {
      await this.prisma.$connect();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      console.log('✅ Database already disconnected');
      return;
    }

    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }
}

export default DatabaseService;