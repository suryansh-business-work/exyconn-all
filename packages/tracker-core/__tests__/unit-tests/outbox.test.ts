import { beforeEach, describe, expect, it } from 'vitest';
import {
  Outbox,
  type FailureKind,
  type OutboxImages,
  type OutboxItem,
  type OutboxStorage,
} from '../../src/outbox';
import type { IntervalPayload, ScreenshotPayload } from '../../src/types';

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

/** An image store that outlives the Outbox, like the queue's own storage. */
function memoryImages(): OutboxImages & { files: Map<string, string> } {
  const files = new Map<string, string>();
  return {
    files,
    put: (key, image) => {
      files.set(key, image);
    },
    get: (key) => files.get(key) ?? null,
    remove: (key) => {
      files.delete(key);
    },
  };
}

function shot(capturedAt: string): ScreenshotPayload {
  return {
    sessionId: 's1',
    intervalStartedAt: capturedAt,
    capturedAt,
    image: `base64-of-${capturedAt}`,
    displayId: 'display:1',
    blurred: false,
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
  let images = memoryImages();
  beforeEach(() => {
    images = memoryImages();
  });

  it('writes an item to storage the moment it is queued, before any send', () => {
    const storage = memoryStorage();
    new Outbox(storage, images).enqueueInterval('s1', interval('a'));
    expect(JSON.parse(storage.saved ?? '[]')).toHaveLength(1);
  });

  it('delivers queued items in FIFO order and empties the queue', async () => {
    const outbox = new Outbox(memoryStorage(), images);
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
    const outbox = new Outbox(memoryStorage(), images);
    outbox.enqueueInterval('s1', interval('a'));
    outbox.enqueueInterval('s1', interval('b'));
    const offline = new TypeError('fetch failed');

    const result = await outbox.flush(() => Promise.reject(offline), alwaysRetry);

    expect(result).toEqual({ sent: 0, dropped: 0, error: offline });
    expect(outbox.size).toBe(2);
  });

  it('drops an item the portal will never accept and keeps draining', async () => {
    const outbox = new Outbox(memoryStorage(), images);
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
    new Outbox(storage, images).enqueueInterval('s1', interval('stuck'));
    const failing = () => Promise.reject(new Error('down'));

    for (let run = 0; run < 4; run += 1) {
      await new Outbox(storage, images).flush(failing, alwaysRetry);
    }
    const last = await new Outbox(storage, images).flush(failing, alwaysRetry);

    expect(last).toMatchObject({ sent: 0, dropped: 1 });
    expect(new Outbox(storage, images).size).toBe(0);
  });

  it('starts empty from unreadable storage rather than refusing to track', () => {
    expect(new Outbox(memoryStorage('{not json'), images).size).toBe(0);
  });

  it('keeps a screenshot image beside the queue, never inside it', () => {
    const storage = memoryStorage();
    new Outbox(storage, images).enqueueScreenshot(shot('t1'));
    expect(storage.saved).not.toContain('base64-of-t1');
    expect([...images.files.values()]).toEqual(['base64-of-t1']);
  });

  it('sends the screenshot with its image read back, then deletes the image', async () => {
    const outbox = new Outbox(memoryStorage(), images);
    outbox.enqueueScreenshot(shot('t1'));
    const sent: OutboxItem[] = [];

    await outbox.flush(async (item) => {
      sent.push(item);
    }, alwaysRetry);

    expect(sent).toEqual([{ kind: 'screenshot', payload: shot('t1') }]);
    expect(images.files.size).toBe(0);
  });

  it('keeps the image while its upload is still being retried', async () => {
    const outbox = new Outbox(memoryStorage(), images);
    outbox.enqueueScreenshot(shot('t1'));
    await outbox.flush(() => Promise.reject(new Error('down')), alwaysRetry);
    expect(images.files.size).toBe(1);
  });

  it('drops a screenshot whose image has gone, and keeps draining', async () => {
    const outbox = new Outbox(memoryStorage(), images);
    outbox.enqueueScreenshot(shot('t1'));
    outbox.enqueueInterval('s1', interval('after'));
    images.files.clear();
    const seen: string[] = [];

    const result = await outbox.flush(async (item) => {
      seen.push(startedAtOf(item));
    }, alwaysRetry);

    expect(result).toMatchObject({ sent: 1, dropped: 1 });
    expect(seen).toEqual(['after']);
  });

  it('moves the images out of a queue an older build saved inline', async () => {
    const storage = memoryStorage(JSON.stringify([{ kind: 'screenshot', payload: shot('old') }]));
    const outbox = new Outbox(storage, images);

    expect(storage.saved).not.toContain('base64-of-old');
    const sent: OutboxItem[] = [];
    await outbox.flush(async (item) => {
      sent.push(item);
    }, alwaysRetry);
    expect(sent).toEqual([{ kind: 'screenshot', payload: shot('old') }]);
  });
});
