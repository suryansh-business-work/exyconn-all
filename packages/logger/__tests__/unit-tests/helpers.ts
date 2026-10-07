import { vi } from 'vitest';
import { createLogger, type LogBatch, type LogEntry, type LoggerConfig } from '../../src';

export const device = () => ({
  appVersion: '1.9.8',
  platform: 'android',
  osVersion: '14',
  deviceModel: 'Pixel 7',
  deviceId: 'd1',
});

export function memoryStorage(initial: string | null = null) {
  let value = initial;
  return { read: () => value, write: (next: string) => (value = next), peek: () => value };
}

/** The queue as it sits in storage right now. */
export function storedQueue(storage: Readonly<{ peek: () => string | null }>): LogEntry[] {
  return JSON.parse(storage.peek() ?? '[]') as LogEntry[];
}

export function setup(overrides: Partial<LoggerConfig> = {}) {
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

/** A promise the test settles by hand, to hold a send in flight. */
export function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
