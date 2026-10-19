import { EventEmitter } from 'node:events';

/**
 * A stand-in for a TCP connection to a SOCKS5 proxy: records what the client writes and lets a
 * test answer, close, fail or fire the idle timeout, the way node:net's Socket would.
 */
export class FakeSocket extends EventEmitter {
  readonly written: Buffer[] = [];
  readonly target: { host: string; port: number };
  timeoutMs = 0;
  destroyed = false;
  private onTimeout: (() => void) | null = null;

  constructor(target: { host: string; port: number }) {
    super();
    this.target = target;
  }

  write(chunk: Buffer): boolean {
    this.written.push(chunk);
    return true;
  }

  setTimeout(ms: number, onTimeout: () => void): this {
    this.timeoutMs = ms;
    this.onTimeout = onTimeout;
    return this;
  }

  /** The proxy stayed silent for the whole timeout. */
  idle(): void {
    this.onTimeout?.();
  }

  destroy(error?: Error): this {
    if (this.destroyed) {
      return this;
    }
    this.destroyed = true;
    if (error) {
      this.emit('error', error);
    }
    this.emit('close');
    return this;
  }
}

/** Lets pending promise callbacks run, so the client has written its next packet. */
export const settle = () => new Promise<void>((resolve) => setImmediate(resolve));
