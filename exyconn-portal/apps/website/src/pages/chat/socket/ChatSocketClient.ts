import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type {
  ChatConnection,
  FrameListener,
  StaffClientFrame,
  StaffServerFrame,
} from './chatSocket.types';

/** Keeps the connection warm through proxies that drop quiet sockets. */
const PING_INTERVAL_MS = 25_000;
const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 30_000;

type StateListener = () => void;

function parseFrame(data: unknown): StaffServerFrame | null {
  if (typeof data !== 'string') {
    return null;
  }
  try {
    const frame: unknown = JSON.parse(data);
    return typeof frame === 'object' && frame !== null && 't' in frame
      ? (frame as StaffServerFrame)
      : null;
  } catch (error) {
    portalLogger.warn('Website chat sent a frame that is not JSON', error);
    return null;
  }
}

/**
 * The console's one chat socket: signs in with the portal token, keeps a ping going, and
 * reconnects with exponential backoff (1s, 2s, 4s … 30s) whenever the connection drops.
 * Pages subscribe to the frames it receives and watch its connection state.
 */
export class ChatSocketClient {
  private socket: WebSocket | null = null;
  private attempt = 0;
  private stopped = true;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private pingTimer: ReturnType<typeof setInterval> | undefined;
  private connection: ChatConnection = 'connecting';
  private readonly frameListeners = new Set<FrameListener>();
  private readonly stateListeners = new Set<StateListener>();

  constructor(
    private readonly url: () => string,
    private readonly token: () => string | null,
  ) {}

  get state(): ChatConnection {
    return this.connection;
  }

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    clearTimeout(this.retryTimer);
    clearInterval(this.pingTimer);
    this.socket?.close();
    this.socket = null;
  }

  /** Sends a frame when the socket is signed in; false tells the caller it did not go. */
  send(frame: StaffClientFrame): boolean {
    if (this.connection !== 'ready' || this.socket?.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.socket.send(JSON.stringify(frame));
    return true;
  }

  subscribe(listener: FrameListener): () => void {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  onStateChange = (listener: StateListener): (() => void) => {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  };

  private setState(next: ChatConnection): void {
    if (this.connection === next) {
      return;
    }
    this.connection = next;
    this.stateListeners.forEach((listener) => listener());
  }

  private connect(): void {
    this.setState('connecting');
    const socket = new WebSocket(this.url());
    this.socket = socket;
    socket.onopen = () => this.greet(socket);
    socket.onmessage = (event: MessageEvent) => this.receive(socket, event.data);
    socket.onerror = () => portalLogger.warn('Website chat socket error');
    socket.onclose = () => this.closed(socket);
  }

  private greet(socket: WebSocket): void {
    socket.send(JSON.stringify({ t: 'hello', role: 'staff', token: this.token() ?? '' }));
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ t: 'ping' }));
      }
    }, PING_INTERVAL_MS);
  }

  private receive(socket: WebSocket, data: unknown): void {
    const frame = parseFrame(data);
    if (!frame) {
      return;
    }
    if (frame.t === 'ready') {
      this.attempt = 0;
      this.setState('ready');
    } else if (frame.t === 'error' && this.connection !== 'ready') {
      // Refused at sign-in (no Website > Chatbot access, or an expired token): retry later.
      portalLogger.warn('Website chat refused the console', { message: frame.message });
      socket.close();
    }
    this.frameListeners.forEach((listener) => listener(frame));
  }

  private closed(socket: WebSocket): void {
    if (this.socket !== socket) {
      return;
    }
    clearInterval(this.pingTimer);
    this.socket = null;
    if (this.stopped) {
      return;
    }
    this.setState('offline');
    const delay = Math.min(MAX_RETRY_MS, FIRST_RETRY_MS * 2 ** this.attempt);
    this.attempt += 1;
    this.retryTimer = setTimeout(() => this.connect(), delay);
  }
}
