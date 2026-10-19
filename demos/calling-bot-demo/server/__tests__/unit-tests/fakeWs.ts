import { EventEmitter } from 'node:events';
import { vi } from 'vitest';

/**
 * Stands in for `ws`'s WebSocket client, so the Sarvam sockets never reach the network: each
 * instance records where it was opened, and a test drives its open/message/error/close events.
 */
export class FakeWebSocket extends EventEmitter {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static readonly instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  readonly send = vi.fn();
  readonly close = vi.fn();

  constructor(
    readonly url: string,
    readonly options: { headers: Record<string, string> },
  ) {
    super();
    FakeWebSocket.instances.push(this);
  }

  static last(): FakeWebSocket {
    const socket = FakeWebSocket.instances.at(-1);
    if (!socket) {
      throw new Error('No socket was opened');
    }
    return socket;
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.emit('open');
  }

  /** A text frame from Sarvam. */
  deliver(text: string): void {
    this.emit('message', Buffer.from(text));
  }

  /** The JSON messages sent so far. */
  sentJson(): unknown[] {
    return this.send.mock.calls.map(([text]) => JSON.parse(String(text)) as unknown);
  }
}
