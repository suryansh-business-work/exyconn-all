import type { IntervalPayload, ScreenshotPayload } from './types';

export type OutboxItem = { attempts?: number } & (
  | { kind: 'interval'; sessionId: string; payload: IntervalPayload }
  | { kind: 'screenshot'; payload: ScreenshotPayload }
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

/** A transient failure this many times running is treated as permanent. */
const MAX_ATTEMPTS = 5;

/**
 * Durable retry queue. Every interval and screenshot is appended here BEFORE the network
 * send is attempted, and only removed once the portal confirms — so a dropped connection,
 * a crash, or a portal outage never loses an employee's recorded time. The queue survives
 * app restarts because it is written to storage.
 *
 * Server-side upserts are idempotent (keyed on session+timestamp), so a retry that the
 * server already saw is harmless.
 */
export class Outbox {
  private items: OutboxItem[];

  constructor(private readonly storage: OutboxStorage) {
    this.items = this.load();
  }

  private load(): OutboxItem[] {
    const saved = this.storage.read();
    if (saved === null) {
      return [];
    }
    try {
      return JSON.parse(saved) as OutboxItem[];
    } catch {
      return [];
    }
  }

  private persist(): void {
    this.storage.write(JSON.stringify(this.items));
  }

  enqueueInterval(sessionId: string, payload: IntervalPayload): void {
    this.items.push({ kind: 'interval', sessionId, payload });
    this.persist();
  }

  enqueueScreenshot(payload: ScreenshotPayload): void {
    this.items.push({ kind: 'screenshot', payload });
    this.persist();
  }

  get size(): number {
    return this.items.length;
  }

  /**
   * Sends every queued item in order. A transient failure stops the drain and keeps the rest
   * queued, preserving order and at-least-once delivery.
   *
   * An item the portal will NEVER accept is dropped and the drain continues. This queue
   * survives restarts, so without that a single poison item — an oversized screenshot, or work
   * belonging to a session this employee no longer owns — blocked every future upload forever,
   * with no way out but deleting the file by hand.
   */
  async flush(
    send: (item: OutboxItem) => Promise<void>,
    classify: (error: unknown) => FailureKind,
  ): Promise<FlushResult> {
    let sent = 0;
    let dropped = 0;
    let error: unknown = null;

    while (this.items.length > 0) {
      const item = this.items[0];
      try {
        await send(item);
        this.items.shift();
        sent += 1;
      } catch (cause) {
        const attempts = (item.attempts ?? 0) + 1;
        item.attempts = attempts;
        if (classify(cause) === 'retry' && attempts < MAX_ATTEMPTS) {
          error = cause;
          break;
        }
        this.items.shift();
        dropped += 1;
      }
    }

    this.persist();
    return { sent, dropped, error };
  }
}
