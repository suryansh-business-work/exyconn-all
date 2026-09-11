import type { IntervalPayload, ScreenshotPayload } from './types';

export type OutboxItem = { attempts?: number } & (
  | { kind: 'interval'; sessionId: string; payload: IntervalPayload }
  | { kind: 'screenshot'; payload: ScreenshotPayload }
);

/** A screenshot as the queue file holds it: everything but the image, which is a key. */
type StoredShot = Omit<ScreenshotPayload, 'image'> & { imageKey: string };

/** What the queue file holds — a pre-2026-09-11 file may still carry an image inline. */
type StoredItem = { attempts?: number } & (
  | { kind: 'interval'; sessionId: string; payload: IntervalPayload }
  | { kind: 'screenshot'; payload: StoredShot | ScreenshotPayload }
);

/** What to do with an item the portal refused. */
export type FailureKind = 'retry' | 'drop';

export interface FlushResult {
  sent: number;
  /** Items the portal will never accept, dropped so they cannot block the queue. */
  dropped: number;
  /** The transient error that stopped the drain, if one did. */
  error: unknown;
}

/**
 * Where the queue lives between launches. Synchronous on purpose: an item is written BEFORE its
 * send is attempted, and a write that finished "later" is one a crash in between would lose.
 * The desktop keeps it in a file under userData, the phone in a file in the app's documents.
 */
export interface OutboxStorage {
  /** The last saved queue, or null when nothing has ever been saved. */
  read(): string | null;
  write(contents: string): void;
}

/**
 * Where queued screenshot images live: one file per image, beside the queue. Kept out of the
 * queue file so the queue stays small — a day offline used to hold every screenshot's base64
 * in the queue, in memory and rewritten on each change, until the phone ran out of memory.
 * Synchronous for the same reason as `OutboxStorage`.
 */
export interface OutboxImages {
  put(key: string, image: string): void;
  /** Null when the image is gone (cleared storage) — its item is then dropped. */
  get(key: string): string | null;
  remove(key: string): void;
}

/** A transient failure this many times running is treated as permanent. */
const MAX_ATTEMPTS = 5;

/** Anything but letters, digits, dot and dash is unsafe in a file name. */
const UNSAFE = /[^\w.-]/g;

/** A file-safe key, unique per shot: one display, one moment, one session. */
function imageKeyOf(shot: ScreenshotPayload): string {
  return [shot.sessionId, shot.capturedAt, shot.displayId]
    .map((part) => part.replaceAll(UNSAFE, '_'))
    .join('-');
}

function isInline(payload: StoredShot | ScreenshotPayload): payload is ScreenshotPayload {
  return 'image' in payload;
}

/**
 * Durable retry queue. Every interval and screenshot is appended here BEFORE the network
 * send is attempted, and only removed once the portal confirms — so a dropped connection,
 * a crash, or a portal outage never loses an employee's recorded time. The queue survives
 * app restarts because it is written to storage; screenshot images are written beside it.
 *
 * Server-side upserts are idempotent (keyed on session+timestamp), so a retry that the
 * server already saw is harmless.
 */
export class Outbox {
  private items: StoredItem[];

  constructor(
    private readonly storage: OutboxStorage,
    private readonly images: OutboxImages,
  ) {
    this.items = this.load();
  }

  private load(): StoredItem[] {
    const saved = this.storage.read();
    if (saved === null) {
      return [];
    }
    let parsed: StoredItem[];
    try {
      parsed = JSON.parse(saved) as StoredItem[];
    } catch {
      return [];
    }
    // A queue saved by an older build carries its images inline: move them out once.
    const hadInline = parsed.some((item) => item.kind === 'screenshot' && isInline(item.payload));
    const items = parsed.map((item) =>
      item.kind === 'screenshot' && isInline(item.payload)
        ? { ...item, payload: this.storeImage(item.payload) }
        : item,
    );
    if (hadInline) {
      this.storage.write(JSON.stringify(items));
    }
    return items;
  }

  private storeImage(shot: ScreenshotPayload): StoredShot {
    const { image, ...rest } = shot;
    const imageKey = imageKeyOf(shot);
    this.images.put(imageKey, image);
    return { ...rest, imageKey };
  }

  private persist(): void {
    this.storage.write(JSON.stringify(this.items));
  }

  enqueueInterval(sessionId: string, payload: IntervalPayload): void {
    this.items.push({ kind: 'interval', sessionId, payload });
    this.persist();
  }

  enqueueScreenshot(payload: ScreenshotPayload): void {
    this.items.push({ kind: 'screenshot', payload: this.storeImage(payload) });
    this.persist();
  }

  get size(): number {
    return this.items.length;
  }

  /** The item as `send` receives it: a screenshot with its image read back. Null when lost. */
  private hydrate(item: StoredItem): OutboxItem | null {
    if (item.kind === 'interval' || isInline(item.payload)) {
      return item as OutboxItem;
    }
    const { imageKey, ...rest } = item.payload;
    const image = this.images.get(imageKey);
    return image === null ? null : { ...item, payload: { ...rest, image } };
  }

  /** Takes the head item off the queue, and its image off the disk. */
  private removeHead(): void {
    const head = this.items.shift();
    if (head?.kind === 'screenshot' && !isInline(head.payload)) {
      this.images.remove(head.payload.imageKey);
    }
  }

  /**
   * Sends every queued item in order. A transient failure stops the drain and keeps the rest
   * queued, preserving order and at-least-once delivery.
   *
   * An item the portal will NEVER accept is dropped and the drain continues. This queue
   * survives restarts, so without that a single poison item — an oversized screenshot, or work
   * belonging to a session this employee no longer owns — blocked every future upload forever,
   * with no way out but deleting the file by hand. A screenshot whose image file has gone is
   * dropped the same way: there is nothing left to send.
   */
  async flush(
    send: (item: OutboxItem) => Promise<void>,
    classify: (error: unknown) => FailureKind,
  ): Promise<FlushResult> {
    let sent = 0;
    let dropped = 0;
    let error: unknown = null;

    while (this.items.length > 0) {
      const stored = this.items[0];
      const item = this.hydrate(stored);
      if (item === null) {
        this.removeHead();
        dropped += 1;
        continue;
      }
      try {
        await send(item);
        this.removeHead();
        sent += 1;
      } catch (cause) {
        const attempts = (stored.attempts ?? 0) + 1;
        stored.attempts = attempts;
        if (classify(cause) === 'retry' && attempts < MAX_ATTEMPTS) {
          error = cause;
          break;
        }
        this.removeHead();
        dropped += 1;
      }
    }

    this.persist();
    return { sent, dropped, error };
  }
}
