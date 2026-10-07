/** The chat's WebSocket: hello on connect, pings, frames, and reconnecting with backoff. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatSocket } from "../../../../../src/components/chat-embed/lib/socket";
import type { ClientFrame } from "../../../../../src/components/chat-embed/types";
import { FakeSocket } from "../fake-socket";

const URL_WS = "wss://portal.example.test/chat/ws";
const HELLO: ClientFrame = { t: "hello", role: "visitor", site: "WEBSITE" };

function setup() {
  const handlers = { hello: vi.fn(() => HELLO), onFrame: vi.fn(), onStatus: vi.fn() };
  return { socket: new ChatSocket(URL_WS, handlers), handlers };
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeSocket.reset();
  vi.stubGlobal("WebSocket", FakeSocket);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ChatSocket connecting", () => {
  it("opens one socket and greets the server once it is open", () => {
    const { socket, handlers } = setup();
    socket.connect();
    socket.connect();
    expect(FakeSocket.instances).toHaveLength(1);
    expect(FakeSocket.latest().url).toBe(URL_WS);
    expect(handlers.onStatus).toHaveBeenLastCalledWith("connecting");

    FakeSocket.latest().open();
    expect(FakeSocket.latest().sent).toEqual([HELLO]);
    expect(handlers.onStatus).toHaveBeenLastCalledWith("open");
  });

  it("pings every 25 seconds while open", () => {
    const { socket } = setup();
    socket.connect();
    FakeSocket.latest().open();
    vi.advanceTimersByTime(25_000);
    vi.advanceTimersByTime(25_000);
    expect(FakeSocket.latest().sent).toEqual([HELLO, { t: "ping" }, { t: "ping" }]);
  });
});

describe("ChatSocket sending and receiving", () => {
  it("sends only while the socket is open", () => {
    const { socket } = setup();
    expect(socket.send({ t: "read" })).toBe(false);
    socket.connect();
    expect(socket.send({ t: "read" })).toBe(false);
    FakeSocket.latest().open();
    expect(socket.send({ t: "read" })).toBe(true);
    expect(FakeSocket.latest().sent).toEqual([HELLO, { t: "read" }]);
  });

  it("hands every parsed frame to the handler", () => {
    const { socket, handlers } = setup();
    socket.connect();
    FakeSocket.latest().receive({ t: "pong" });
    expect(handlers.onFrame).toHaveBeenCalledWith({ t: "pong" });
  });

  it("logs a frame it cannot parse instead of throwing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { socket, handlers } = setup();
    socket.connect();
    FakeSocket.latest().receive("{not json");
    expect(handlers.onFrame).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith("[chat] could not handle a frame", expect.any(SyntaxError));
  });
});

describe("ChatSocket reconnecting", () => {
  it("retries with a doubling delay, and waits while a retry is pending", () => {
    const { socket, handlers } = setup();
    socket.connect();
    FakeSocket.latest().drop();
    expect(handlers.onStatus).toHaveBeenLastCalledWith("reconnecting");
    socket.connect();
    expect(FakeSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(999);
    expect(FakeSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(2);

    FakeSocket.latest().drop();
    vi.advanceTimersByTime(1_999);
    expect(FakeSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(3);
    expect(handlers.onStatus).toHaveBeenLastCalledWith("reconnecting");
  });

  it("caps the delay at 30 seconds", () => {
    const { socket } = setup();
    socket.connect();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      FakeSocket.latest().drop();
      vi.advanceTimersByTime(30_000);
    }
    const count = FakeSocket.instances.length;
    FakeSocket.latest().drop();
    vi.advanceTimersByTime(29_999);
    expect(FakeSocket.instances).toHaveLength(count);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(count + 1);
  });

  it("starts the backoff again after a successful open", () => {
    const { socket } = setup();
    socket.connect();
    FakeSocket.latest().drop();
    vi.advanceTimersByTime(1_000);
    FakeSocket.latest().open();
    FakeSocket.latest().drop();
    vi.advanceTimersByTime(1_000);
    expect(FakeSocket.instances).toHaveLength(3);
  });

  it("ignores a late close from a socket it already replaced", () => {
    const { socket, handlers } = setup();
    socket.connect();
    const first = FakeSocket.latest();
    first.drop();
    const calls = handlers.onStatus.mock.calls.length;
    first.drop();
    expect(handlers.onStatus).toHaveBeenCalledTimes(calls);
    vi.advanceTimersByTime(60_000);
    expect(FakeSocket.instances).toHaveLength(2);
  });
});

describe("ChatSocket dispose", () => {
  it("closes the socket, stops pinging and never reconnects", () => {
    const { socket, handlers } = setup();
    socket.connect();
    const live = FakeSocket.latest();
    live.open();
    socket.dispose();
    expect(live.closeCalls).toBe(1);
    expect(handlers.onStatus).toHaveBeenLastCalledWith("open");

    vi.advanceTimersByTime(60_000);
    expect(live.sent).toEqual([HELLO]);
    socket.connect();
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it("cancels a pending retry", () => {
    const { socket } = setup();
    socket.connect();
    FakeSocket.latest().drop();
    socket.dispose();
    vi.advanceTimersByTime(60_000);
    expect(FakeSocket.instances).toHaveLength(1);
  });
});
