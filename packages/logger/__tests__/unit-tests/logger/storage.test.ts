import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Logger, LogStorage } from '../../../src';
import { memoryStorage, setup, storedQueue } from '../helpers';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('createLogger storage', () => {
  it('starts empty and sends nothing when the stored queue is not a list', async () => {
    const { send, logger } = setup({ storage: memoryStorage('{"level":"ERROR"}') });
    await vi.runAllTimersAsync();
    expect(send).not.toHaveBeenCalled();
    logger.info('fresh');
    await vi.runAllTimersAsync();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].entries.map((entry) => entry.message)).toEqual(['fresh']);
  });

  it('treats an empty stored value as an empty queue', async () => {
    const { send } = setup({ storage: memoryStorage('') });
    await vi.runAllTimersAsync();
    expect(send).not.toHaveBeenCalled();
  });

  it('works in memory only when no storage is given', async () => {
    const { logger, batches } = setup({ storage: undefined });
    logger.error('In memory');
    await vi.runOnlyPendingTimersAsync();
    expect(batches[0].entries[0].message).toBe('In memory');
  });

  it('keeps logging and sending when writing to storage throws', async () => {
    const storage: LogStorage = {
      read: () => null,
      write: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const { logger, batches } = setup({ storage });
    expect(() => logger.error('Disk full')).not.toThrow();
    await vi.runOnlyPendingTimersAsync();
    expect(batches[0].entries[0].message).toBe('Disk full');
  });

  it('ignores a log raised while an entry is being recorded', () => {
    const echo: { logger?: Logger } = {};
    const writes: string[] = [];
    const storage: LogStorage = {
      read: () => null,
      write: (value) => {
        writes.push(value);
        echo.logger?.warn('Storage echo');
      },
    };
    const { logger } = setup({ storage });
    echo.logger = logger;
    logger.error('Original');
    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0])).toEqual([expect.objectContaining({ message: 'Original' })]);
  });

  it('removes sent entries from storage and keeps the rest', async () => {
    const { logger, storage, send } = setup({ flushIntervalMs: 1000 });
    logger.error('Sent');
    await vi.runOnlyPendingTimersAsync();
    expect(storedQueue(storage)).toEqual([]);
    send.mockRejectedValueOnce(new Error('offline'));
    logger.error('Kept');
    await vi.runOnlyPendingTimersAsync();
    expect(storedQueue(storage).map((entry) => entry.message)).toEqual(['Kept']);
  });
});
