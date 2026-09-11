import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureConsole,
  createLogger,
  MAX_QUEUED_LOGS,
  type LogBatch,
  type LoggerConfig,
} from '../../src';

const device = () => ({
  appVersion: '1.9.8',
  platform: 'android',
  osVersion: '14',
  deviceModel: 'Pixel 7',
  deviceId: 'd1',
});

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return { read: () => value, write: (next: string) => (value = next), peek: () => value };
}

function setup(overrides: Partial<LoggerConfig> = {}) {
  const batches: LogBatch[] = [];
  const send = vi.fn(async (batch: LogBatch) => {
    batches.push(batch);
  });
  const storage = memoryStorage();
  const logger = createLogger({
    source: 'MOBILE',
    app: 'tracker-mobile',
    send,
    device,
    user: () => ({ id: 'u1', name: 'Asha', email: 'asha@exyconn.com' }),
    storage,
    ...overrides,
  });
  return { logger, send, batches, storage };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('createLogger', () => {
  it('sends an error at once, with the device, the user, the route and what came before', async () => {
    const { logger, batches } = setup();
    logger.setRoute('/settings');
    logger.debug('Loaded settings');
    logger.error('Saving failed', new TypeError('x is undefined'), { field: 'timezone' });
    await vi.runOnlyPendingTimersAsync();

    expect(batches).toHaveLength(1);
    const [batch] = batches;
    expect(batch).toMatchObject({ app: 'tracker-mobile', platform: 'android', user: { id: 'u1' } });
    const error = batch.entries.find((entry) => entry.level === 'ERROR');
    expect(error).toMatchObject({
      message: 'Saving failed: x is undefined',
      errorName: 'TypeError',
      route: '/settings',
      context: '{"field":"timezone"}',
    });
    expect(error?.stack).toContain('TypeError');
    expect(error?.breadcrumbs.map((crumb) => crumb.message)).toEqual([
      'Opened /settings',
      'Loaded settings',
    ]);
  });

  it('holds non-errors until the interval, and folds identical entries into one', async () => {
    const { logger, send, batches } = setup({ flushIntervalMs: 5000 });
    logger.warn('Slow sync');
    logger.warn('Slow sync');
    logger.warn('Slow sync');
    await vi.advanceTimersByTimeAsync(4000);
    expect(send).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(batches[0].entries).toHaveLength(1);
    expect(batches[0].entries[0].count).toBe(3);
  });

  it('keeps a batch that failed to send and sends it on the next attempt', async () => {
    const { logger, send, storage } = setup({ flushIntervalMs: 1000 });
    send.mockRejectedValueOnce(new Error('offline'));
    logger.error('Boom');
    await vi.runOnlyPendingTimersAsync();
    expect(storage.peek()).toContain('Boom');

    await vi.advanceTimersByTimeAsync(1000);
    expect(send).toHaveBeenCalledTimes(2);
    expect(storage.peek()).toBe('[]');
  });

  it('sends what a crashed run left on disk as soon as it starts', async () => {
    const first = setup();
    first.send.mockRejectedValue(new Error('killed'));
    first.logger.capture(new RangeError('fatal'));
    await vi.runOnlyPendingTimersAsync();

    const { batches } = setup({ storage: memoryStorage(first.storage.peek()) });
    await vi.runOnlyPendingTimersAsync();
    expect(batches[0].entries[0]).toMatchObject({ message: 'fatal', errorName: 'RangeError' });
  });

  it('drops the oldest entries past the cap', async () => {
    const { logger, send, storage } = setup();
    send.mockRejectedValue(new Error('offline'));
    for (let i = 0; i < MAX_QUEUED_LOGS + 5; i += 1) {
      logger.info(`step ${i}`);
    }
    const queued = JSON.parse(storage.peek() ?? '[]') as Array<{ message: string }>;
    expect(queued).toHaveLength(MAX_QUEUED_LOGS);
    expect(queued[0].message).toBe('step 5');
  });

  it('ignores a corrupt stored queue', () => {
    expect(() => setup({ storage: memoryStorage('{not json') })).not.toThrow();
  });
});

describe('captureConsole', () => {
  it('forwards console.error and console.warn and still prints them', async () => {
    const { logger, batches } = setup({ flushIntervalMs: 1 });
    const printed: unknown[][] = [];
    const target = {
      error: (...args: unknown[]) => printed.push(args),
      warn: (...args: unknown[]) => printed.push(args),
    };
    captureConsole(logger, target);
    captureConsole(logger, target);

    target.error('Tracker action failed', new Error('Network request failed'));
    target.warn('Deprecated', { key: 'value' });
    await vi.runAllTimersAsync();

    expect(printed).toHaveLength(2);
    const messages = batches.flatMap((batch) => batch.entries.map((entry) => entry.message));
    expect(messages).toEqual([
      'Tracker action failed: Network request failed',
      'Deprecated {"key":"value"}',
    ]);
  });
});
