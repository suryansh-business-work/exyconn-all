import {
  recordServerErrors,
  resetLogIngestLimits,
  type LogEntryInput,
} from '../../../../src/modules/logs/logs.ingest';
import { AppLogGroupModel } from '../../../../src/modules/logs/app-log-group.model';
import { SERVER_ERROR_WRITES_PER_MINUTE } from '../../../../src/modules/logs/logs.constants';
import { logger } from '../../../../src/utils/logger';
import { freezeClock } from '../../../helpers';

const NOW = new Date('2026-09-11T10:00:00.000Z');

const entries = (count: number): LogEntryInput[] =>
  Array.from({ length: count }, (_, index) => ({
    level: 'ERROR' as const,
    message: `Fault ${index}`,
    occurredAt: NOW,
  }));

let warned: jest.SpyInstance;
let failed: jest.SpyInstance;

beforeEach(() => {
  // The bucket refills by the clock, so the clock stands still before it is refilled.
  freezeClock(NOW.toISOString());
  resetLogIngestLimits();
  warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
  failed = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  warned.mockRestore();
  failed.mockRestore();
  jest.useRealTimers();
});

describe('the server error write budget', () => {
  it('drops what is over the budget and says so once a minute', async () => {
    // Every write fails at once, so the budget is spent without filling the database.
    const write = jest.spyOn(AppLogGroupModel, 'findOneAndUpdate').mockImplementation(() => {
      throw new Error('write refused');
    });

    await recordServerErrors(entries(SERVER_ERROR_WRITES_PER_MINUTE + 1), { user: null });
    await recordServerErrors(entries(1), { user: null });

    expect(warned).toHaveBeenCalledTimes(1);
    expect(warned).toHaveBeenCalledWith(
      { dropped: 1 },
      'Server error log writes are over budget; dropping the Mongo copy',
    );
    // The first call reached the store and failed there; the second had no budget left.
    expect(write).toHaveBeenCalledTimes(1);
    expect(failed).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Could not store a server error log',
    );
    write.mockRestore();
  });

  it('refills as the minute passes', async () => {
    const write = jest.spyOn(AppLogGroupModel, 'findOneAndUpdate').mockImplementation(() => {
      throw new Error('write refused');
    });
    await recordServerErrors(entries(SERVER_ERROR_WRITES_PER_MINUTE), { user: null });
    write.mockRestore();

    await recordServerErrors(entries(1), { user: null });
    expect(await AppLogGroupModel.countDocuments()).toBe(0);

    jest.setSystemTime(new Date(NOW.getTime() + 60_000));
    await recordServerErrors(entries(1), { user: null });

    expect(await AppLogGroupModel.countDocuments()).toBe(1);
  });
});
