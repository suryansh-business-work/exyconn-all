import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The outbox persists under app.getPath('userData'); point that at a temp dir for the test.
const tempDir = mkdtempSync(join(tmpdir(), 'outbox-'));
vi.mock('electron', () => ({
  app: { getPath: () => tempDir },
}));

import { Outbox, type OutboxItem } from './outbox';
import type { IntervalPayload } from './portal-client';

const OUTBOX_FILE = join(tempDir, 'tracker-outbox.json');

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
    const sent = await outbox.flush((item: OutboxItem) => {
      if (item.kind === 'interval') {
        seen.push(item.payload.startedAt);
      }
      return Promise.resolve();
    });

    expect(sent).toBe(2);
    expect(seen).toEqual(['a', 'b']);
    expect(outbox.size).toBe(0);
  });

  it('stops at the first failure and keeps the rest (at-least-once, ordered)', async () => {
    const outbox = new Outbox();
    outbox.enqueueInterval('s1', interval('a'));
    outbox.enqueueInterval('s1', interval('b'));
    outbox.enqueueInterval('s1', interval('c'));

    let calls = 0;
    const sent = await outbox.flush(() => {
      calls += 1;
      // Succeed on 'a', then fail — 'b' and 'c' must remain queued.
      return calls === 1 ? Promise.resolve() : Promise.reject(new Error('offline'));
    });

    expect(sent).toBe(1);
    expect(outbox.size).toBe(2);
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

    const sent = await second.flush(() => Promise.resolve());
    expect(sent).toBe(1);
  });
});
