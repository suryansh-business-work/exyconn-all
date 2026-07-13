import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Mongoose connection manager (singleton). Reuses a single connection across the
 * whole process; subsequent calls resolve to the established connection.
 */
class Database {
  private connection: typeof mongoose | null = null;

  async connect(uri: string = env.mongoUri): Promise<typeof mongoose> {
    if (this.connection) {
      return this.connection;
    }
    mongoose.set('strictQuery', true);
    this.connection = await mongoose.connect(uri);
    logger.info('MongoDB connected');
    return this.connection;
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }
    await mongoose.disconnect();
    this.connection = null;
    logger.info('MongoDB disconnected');
  }
}

export const database = new Database();
