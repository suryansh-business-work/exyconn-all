/**
 * A WebSocket stand-in for the chat's socket tests: it records what it is sent, and a test
 * drives it with `open()`, `receive()` and `drop()`. `close()` reports the close at once.
 */
type Listener = (event: { data?: unknown }) => void;

export class FakeSocket {
  static readonly OPEN = 1;
  static readonly instances: FakeSocket[] = [];

  readyState = 0;
  readonly sent: unknown[] = [];
  closeCalls = 0;
  private readonly listeners = new Map<string, Listener[]>();

  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }

  /** The socket the code under test opened last. */
  static latest(): FakeSocket {
    const socket = FakeSocket.instances.at(-1);
    if (!socket) {
      throw new Error("No socket was opened");
    }
    return socket;
  }

  static reset(): void {
    FakeSocket.instances.length = 0;
  }

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  close(): void {
    this.closeCalls += 1;
    this.drop();
  }

  open(): void {
    this.readyState = FakeSocket.OPEN;
    this.emit("open", {});
  }

  receive(data: unknown): void {
    this.emit("message", { data: typeof data === "string" ? data : JSON.stringify(data) });
  }

  drop(): void {
    this.readyState = 3;
    this.emit("close", {});
  }

  private emit(type: string, event: { data?: unknown }): void {
    (this.listeners.get(type) ?? []).forEach((listener) => listener(event));
  }
}
