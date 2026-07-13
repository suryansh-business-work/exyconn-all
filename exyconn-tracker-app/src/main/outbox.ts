import { app } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { IntervalPayload, ScreenshotPayload } from './portal-client';

type OutboxItem =
  | { kind: 'interval'; sessionId: string; payload: IntervalPayload }
  | { kind: 'screenshot'; payload: ScreenshotPayload };

/**
 * Durable retry queue. Every interval and screenshot is appended here BEFORE the network
 * send is attempted, and only removed once the portal confirms — so a dropped connection,
 * a crash, or a portal outage never loses an employee's recorded time. The queue survives
 * app restarts because it is written to disk.
 *
 * Server-side upserts are idempotent (keyed on session+timestamp), so a retry that the
 * server already saw is harmless.
 */
export class Outbox {
  private readonly file = join(app.getPath('userData'), 'tracker-outbox.json');
  private items: OutboxItem[] = [];

  constructor() {
    this.items = this.load();
  }

  private load(): OutboxItem[] {
    if (existsSync(this.file)) {
      try {
        return JSON.parse(readFileSync(this.file, 'utf-8')) as OutboxItem[];
      } catch {
        return [];
      }
    }
    return [];
  }

  private persist(): void {
    mkdirSync(app.getPath('userData'), { recursive: true });
    writeFileSync(this.file, JSON.stringify(this.items), 'utf-8');
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
   * Attempts to send every queued item in order via `send`. Items that succeed are
   * dropped; on the first failure it stops and keeps the rest for the next flush, so
   * ordering and at-least-once delivery are preserved.
   */
  async flush(send: (item: OutboxItem) => Promise<void>): Promise<number> {
    let sent = 0;
    while (this.items.length > 0) {
      const item = this.items[0];
      try {
        await send(item);
        this.items.shift();
        sent += 1;
      } catch {
        break;
      }
    }
    if (sent > 0) {
      this.persist();
    }
    return sent;
  }
}

export type { OutboxItem };
