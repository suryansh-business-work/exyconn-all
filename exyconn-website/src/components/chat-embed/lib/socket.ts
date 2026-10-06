import type { ClientFrame, ServerFrame } from "../types";

export type Connection = "idle" | "connecting" | "open" | "reconnecting";

const PING_MS = 25_000;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

export interface SocketHandlers {
  /** The first frame of every connection; read fresh each time so it carries the latest pass. */
  hello(): ClientFrame;
  onFrame(frame: ServerFrame): void;
  onStatus(status: Connection): void;
}

/**
 * One JSON WebSocket to /chat/ws that greets the server on every (re)connect, keeps itself
 * alive with a ping every 25 s, and reconnects with exponential backoff capped at 30 s.
 */
export class ChatSocket {
  private ws: WebSocket | null = null;
  private attempt = 0;
  private pingTimer: ReturnType<typeof setInterval> | undefined;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;

  constructor(
    private readonly url: string,
    private readonly handlers: SocketHandlers
  ) {}

  /** Opens the socket unless it is open, opening, or waiting to retry. */
  connect(): void {
    if (this.ws || this.retryTimer || this.disposed) {
      return;
    }
    this.handlers.onStatus(this.attempt === 0 ? "connecting" : "reconnecting");
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.addEventListener("open", () => this.opened(ws));
    ws.addEventListener("message", (event) => this.received(event));
    ws.addEventListener("close", () => this.closed(ws));
  }

  /** Sends a frame; false when the socket is not open, so the caller can say so. */
  send(frame: ClientFrame): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.ws.send(JSON.stringify(frame));
    return true;
  }

  dispose(): void {
    this.disposed = true;
    clearInterval(this.pingTimer);
    clearTimeout(this.retryTimer);
    this.ws?.close();
    this.ws = null;
  }

  private opened(ws: WebSocket): void {
    this.attempt = 0;
    ws.send(JSON.stringify(this.handlers.hello()));
    this.pingTimer = setInterval(() => this.send({ t: "ping" }), PING_MS);
    this.handlers.onStatus("open");
  }

  private received(event: MessageEvent): void {
    try {
      this.handlers.onFrame(JSON.parse(String(event.data)) as ServerFrame);
    } catch (error) {
      console.error("[chat] could not handle a frame", error);
    }
  }

  private closed(ws: WebSocket): void {
    if (this.ws !== ws) {
      return;
    }
    clearInterval(this.pingTimer);
    this.ws = null;
    if (this.disposed) {
      return;
    }
    const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** this.attempt);
    this.attempt += 1;
    this.handlers.onStatus("reconnecting");
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      this.connect();
    }, delay);
  }
}
