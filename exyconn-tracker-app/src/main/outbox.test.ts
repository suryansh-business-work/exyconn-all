import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The outbox persists under app.getPath('userData'); point that at a temp dir for the test.
const tempDir = mkdtempSync(join(tmpdir(), 'outbox-'));
vi.mock('electron', () => ({
  app: { getPath: () => tempDir },
}));

import { Outbox, type FailureKind, type OutboxItem } from './outbox';
import type { IntervalPayload } from './portal-client';

const OUTBOX_FILE = join(tempDir, 'tracker-outbox.json');

/** The classifier the engine passes in: everything is worth retrying. */
const alwaysRetry = (): FailureKind => 'retry';
/** The portal has made up its mind — retrying can never help. */
const alwaysDrop = (): FailureKind => 'drop';

function interval(startedAt: string): IntervalPayload {
  return {
    startedAt,
    endedAt: startedAt,
    keyCount: 1,
    mouseCount: 1,
    activeMs: 1000,
    idleMs: 0,
    windows: [],
  };
}

describe('Outbox', () => {
  beforeEach(() => {
    // Each test shares one on-disk path; wipe it so a fresh Outbox starts empty.
    rmSync(OUTBOX_FILE, { force: true });
  });

  it('delivers queued items in FIFO order', async () => {
    const outbox = new Outbox();
    outbox.enqueueInterval('s1', interval('a'));
    outbox.enqueueInterval('s1', interval('b'));

    const seen: string[] = [];
    const result = await outbox.flush((item: OutboxItem) => {
      if (item.kind === 'interval') {
        seen.push(item.payload.startedAt);
      }
      return Promise.resolve();
    }, alwaysRetry);

    expect(result.sent).toBe(2);
    expect(result.dropped).toBe(0);
    expect(result.error).toBeNull();
    expect(seen).toEqual(['a', 'b']);
    expect(outbox.size).toBe(0);
  });

  it('stops at a transient failure and keeps the rest (at-least-once, ordered)', async () => {
    const outbox = new Outbox();
    outbox.enqueueInterval('s1', interval('a'));
    outbox.enqueueInterval('s1', interval('b'));
    outbox.enqueueInterval('s1', interval('c'));

    let calls = 0;
    const result = await outbox.flush(() => {
      calls += 1;
      // Succeed on 'a', then fail — 'b' and 'c' must remain queued.
      return calls === 1 ? Promise.resolve() : Promise.reject(new Error('offline'));
    }, alwaysRetry);

    expect(result.sent).toBe(1);
    expect(result.dropped).toBe(0);
    expect(result.error).toBeInstanceOf(Error);
    expect(outbox.size).toBe(2);
  });

  it('drops an item the portal will never accept and keeps draining the rest', async () => {
    const outbox = new Outbox();
    outbox.enqueueInterval('s1', interval('poison'));
    outbox.enqueueInterval('s1', interval('good'));

    const seen: string[] = [];
    const result = await outbox.flush((item: OutboxItem) => {
      if (item.kind === 'interval' && item.payload.startedAt === 'poison') {
        return Promise.reject(new Error('rejected'));
      }
      if (item.kind === 'interval') {
        seen.push(item.payload.startedAt);
      }
      return Promise.resolve();
    }, alwaysDrop);

    expect(result.dropped).toBe(1);
    expect(result.sent).toBe(1);
    expect(seen).toEqual(['good']);
    expect(outbox.size).toBe(0);
  });

  it('never wedges forever: a repeatedly failing item is dropped after its attempts run out', async () => {
    const outbox = new Outbox();
    outbox.enqueueInterval('s1', interval('stuck'));
    outbox.enqueueInterval('s1', interval('behind-it'));

    // Every flush fails on the head item and is classified as retryable — the situation that
    // used to block the queue permanently, across restarts.
    let lastSize = outbox.size;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await outbox.flush(
        (item: OutboxItem) =>
          item.kind === 'interval' && item.payload.startedAt === 'stuck'
            ? Promise.reject(new Error('offline'))
            : Promise.resolve(),
        alwaysRetry,
      );
      lastSize = outbox.size;
    }

    // The poison item is gone and the item behind it finally got through.
    expect(lastSize).toBe(0);
  });

  it('remembers attempts across a restart, so a restart cannot reset the wedge', async () => {
    const first = new Outbox();
    first.enqueueInterval('s1', interval('stuck'));
    await first.flush(() => Promise.reject(new Error('offline')), alwaysRetry);

    const second = new Outbox();
    expect(second.size).toBe(1);

    // Four more failures (5 total) retire the item rather than blocking the queue for good.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await second.flush(() => Promise.reject(new Error('offline')), alwaysRetry);
    }
    expect(second.size).toBe(0);
  });

  it('survives a restart by reloading from disk', async () => {
    const first = new Outbox();
    first.enqueueScreenshot({
      sessionId: 's1',
      intervalStartedAt: 'x',
      capturedAt: 'x',
      image: 'data',
      displayId: '1',
      blurred: false,
    });
    expect(first.size).toBe(1);

    // A brand-new instance (simulating an app restart) sees the persisted item.
    const second = new Outbox();
    expect(second.size).toBe(1);

    const result = await second.flush(() => Promise.resolve(), alwaysRetry);
    expect(result.sent).toBe(1);
  });
});
