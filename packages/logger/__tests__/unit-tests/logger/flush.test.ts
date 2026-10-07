import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOG_BATCH_SIZE, MAX_QUEUED_LOGS } from '../../../src';
import { deferred, setup, storedQueue } from '../helpers';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const messages = (batch: Readonly<{ entries: ReadonlyArray<{ message: string }> }>) =>
  batch.entries.map((entry) => entry.message);

describe('createLogger flush', () => {
  it('waits the default 10 seconds for non-errors', async () => {
    const { logger, send } = setup();
    logger.info('Quiet');
    await vi.advanceTimersByTimeAsync(9999);
    expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends waiting entries at once when an error arrives', async () => {
    const { logger, batches } = setup({ flushIntervalMs: 5000 });
    logger.info('First');
    logger.info('Second');
    logger.error('Crash');
    await vi.advanceTimersByTimeAsync(0);
    expect(batches).toHaveLength(1);
    expect(messages(batches[0])).toEqual(['First', 'Second', 'Crash']);
  });

  it('does nothing when asked to flush an empty queue', async () => {
    const { logger, send } = setup();
    await logger.flush();
    expect(send).not.toHaveBeenCalled();
  });

  it('resolves a manual flush even when the send fails', async () => {
    const { logger, send } = setup();
    send.mockRejectedValueOnce(new Error('offline'));
    logger.info('Manual');
    await expect(logger.flush()).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends in batches and keeps going until the queue is empty', async () => {
    const { logger, batches, storage } = setup({ flushIntervalMs: 1000 });
    for (let i = 0; i < LOG_BATCH_SIZE + 5; i += 1) {
      logger.info(`step ${i}`);
    }
    await vi.advanceTimersByTimeAsync(1000);
    expect(batches).toHaveLength(1);
    await vi.runOnlyPendingTimersAsync();
    expect(batches.map((batch) => batch.entries.length)).toEqual([LOG_BATCH_SIZE, 5]);
    expect(storedQueue(storage)).toEqual([]);
    expect(batches[1].sessionId).toBe(batches[0].sessionId);
    expect(batches[0].sessionId).toMatch(/^[a-z\d]+-[a-z\d]+$/);
  });

  it('sends a null user and the device read at send time', async () => {
    let version = '1.0.0';
    const { logger, batches } = setup({
      user: () => null,
      device: () => ({
        appVersion: version,
        platform: null,
        osVersion: null,
        deviceModel: null,
        deviceId: null,
      }),
    });
    logger.error('Signed out');
    version = '1.0.1';
    await vi.runOnlyPendingTimersAsync();
    expect(batches[0]).toMatchObject({ user: null, appVersion: '1.0.1', source: 'MOBILE' });
  });

  it('does not fold into an entry in flight, and does not start a second send', async () => {
    const { logger, send } = setup();
    const pending = deferred();
    send.mockImplementationOnce(() => pending.promise);
    logger.error('Boom');
    await vi.advanceTimersByTimeAsync(0);
    logger.error('Boom');
    await vi.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledTimes(1);

    pending.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledTimes(2);
    const second = send.mock.calls[1][0];
    expect(messages(second)).toEqual(['Boom']);
    expect(second.entries[0].count).toBe(1);
  });

  it('copes with in-flight entries dropped by the cap before the send finished', async () => {
    const { logger, send, storage } = setup({ flushIntervalMs: 1000 });
    const pending = deferred();
    send.mockImplementationOnce(() => pending.promise);
    logger.error('Oldest');
    await vi.advanceTimersByTimeAsync(0);
    for (let i = 0; i < MAX_QUEUED_LOGS; i += 1) {
      logger.info(`step ${i}`);
    }
    send.mockRejectedValue(new Error('offline'));
    pending.resolve();
    await vi.advanceTimersByTimeAsync(0);

    const queued = storedQueue(storage);
    expect(queued).toHaveLength(MAX_QUEUED_LOGS);
    expect(queued.some((entry) => entry.message === 'Oldest')).toBe(false);
    expect(send).toHaveBeenCalledTimes(2);
    expect(messages(send.mock.calls[1][0])[0]).toBe('step 0');
  });

  it('swallows a failure inside a timed flush instead of raising an unhandled rejection', async () => {
    const { logger, send } = setup();
    send.mockRejectedValueOnce(new Error('offline'));
    logger.error('Boom');
    const timers = vi.spyOn(globalThis, 'setTimeout').mockImplementationOnce(() => {
      throw new Error('timers unavailable');
    });
    await vi.runOnlyPendingTimersAsync();
    expect(timers).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);

    timers.mockRestore();
    await logger.flush();
    expect(send).toHaveBeenCalledTimes(2);
    expect(messages(send.mock.calls[1][0])).toEqual(['Boom']);
  });
});
