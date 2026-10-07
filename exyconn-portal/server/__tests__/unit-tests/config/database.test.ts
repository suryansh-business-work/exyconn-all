import mongoose from 'mongoose';
import { database } from '../../../src/config/database';
import { env } from '../../../src/config/env';
import { logger } from '../../../src/utils/logger';

jest.mock('../../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

/**
 * The harness already holds the real connection to the in-memory server, so the singleton is
 * driven against spies: what matters is when it connects, and that it connects only once.
 */
describe('database', () => {
  let connect: jest.SpyInstance;
  let disconnect: jest.SpyInstance;

  beforeEach(() => {
    connect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    disconnect = jest.spyOn(mongoose, 'disconnect').mockResolvedValue(undefined);
  });

  afterEach(() => {
    connect.mockRestore();
    disconnect.mockRestore();
  });

  it('does nothing when asked to disconnect before connecting', async () => {
    await database.disconnect();
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('connects once to the configured URI, then reuses that connection', async () => {
    const first = await database.connect();
    expect(connect).toHaveBeenCalledWith(env.mongoUri);
    expect(mongoose.get('strictQuery')).toBe(true);
    expect(logger.info).toHaveBeenCalledWith('MongoDB connected');

    const second = await database.connect('mongodb://elsewhere/db');
    expect(second).toBe(first);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('disconnects and forgets the connection, so the next connect opens a new one', async () => {
    await database.disconnect();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('MongoDB disconnected');

    await database.connect('mongodb://other/db');
    expect(connect).toHaveBeenCalledWith('mongodb://other/db');
    await database.disconnect();
  });
});
