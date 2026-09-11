import { describe, expect, it } from 'vitest';
import { Outbox, type FailureKind, type OutboxItem, type OutboxStorage } from '../../src/outbox';
import type { IntervalPayload } from '../../src/types';

/** Storage that outlives the Outbox reading it — a second instance is a restart. */
function memoryStorage(initial: string | null = null): OutboxStorage & { saved: string | null } {
  return {
    saved: initial,
    read() {
      return this.saved;
    },
    write(contents: string) {
      this.saved = contents;
    },
  };
}

const alwaysRetry = (): FailureKind => 'retry';
const alwaysDrop = (): FailureKind => 'drop';

function interval(startedAt: string): IntervalPayload {
  return {
    startedAt,
    endedAt: startedAt,
    keyCount: 0,
    mouseCount: 0,
    activeMs: 1000,
    idleMs: 0,
    windows: [],
  };
}

function startedAtOf(item: OutboxItem): string {
  return item.kind === 'interval' ? item.payload.startedAt : item.payload.capturedAt;
}

describe('Outbox', () => {
  it('writes an item to storage the moment it is queued, before any send', () => {
    const storage = memoryStorage();
    new Outbox(storage).enqueueInterval('s1', interval('a'));
    expect(JSON.parse(storage.saved ?? '[]')).toHaveLength(1);
  });

  it('delivers queued items in FIFO order and empties the queue', async () => {
    const outbox = new Outbox(memoryStorage());
    outbox.enqueueInterval('s1', interval('a'));
    outbox.enqueueInterval('s1', interval('b'));
    const seen: string[] = [];

    const result = await outbox.flush(async (item) => {
      seen.push(startedAtOf(item));
    }, alwaysRetry);

    expect(seen).toEqual(['a', 'b']);
    expect(result).toEqual({ sent: 2, dropped: 0, error: null });
    expect(outbox.size).toBe(0);
  });

  it('stops at a transient failure and keeps the rest queued, in order', async () => {
    const outbox = new Outbox(memoryStorage());
    outbox.enqueueInterval('s1', interval('a'));
    outbox.enqueueInterval('s1', interval('b'));
    const offline = new TypeError('fetch failed');

    const result = await outbox.flush(() => Promise.reject(offline), alwaysRetry);

    expect(result).toEqual({ sent: 0, dropped: 0, error: offline });
    expect(outbox.size).toBe(2);
  });

  it('drops an item the portal will never accept and keeps draining', async () => {
    const outbox = new Outbox(memoryStorage());
    outbox.enqueueInterval('s1', interval('poison'));
    outbox.enqueueInterval('s1', interval('good'));

    const result = await outbox.flush(
      (item) =>
        startedAtOf(item) === 'poison' ? Promise.reject(new Error('rejected')) : Promise.resolve(),
      alwaysDrop,
    );

    expect(result).toMatchObject({ sent: 1, dropped: 1, error: null });
    expect(outbox.size).toBe(0);
  });

  it('remembers attempts across a restart, so a restart cannot reset the wedge', async () => {
    const storage = memoryStorage();
    new Outbox(storage).enqueueInterval('s1', interval('stuck'));
    const failing = () => Promise.reject(new Error('down'));

    for (let run = 0; run < 4; run += 1) {
      await new Outbox(storage).flush(failing, alwaysRetry);
    }
    const last = await new Outbox(storage).flush(failing, alwaysRetry);

    expect(last).toMatchObject({ sent: 0, dropped: 1 });
    expect(new Outbox(storage).size).toBe(0);
  });

  it('starts empty from unreadable storage rather than refusing to track', () => {
    expect(new Outbox(memoryStorage('{not json')).size).toBe(0);
  });
});
