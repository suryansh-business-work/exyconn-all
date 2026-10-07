// @vitest-environment jsdom
/** The chat controller: sending, retrying and discarding messages, typing, rating and ending. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { strings } from "../../../../../src/components/chat-embed/strings";
import { resetChatEnvironment, startController, stopControllers } from "./controller-harness";

vi.mock("../../../../../src/components/chat-embed/lib/sound", () => ({
  primeAudio: vi.fn(),
  chime: vi.fn(),
}));

const FILE = { name: "photo.png", data: "data:image/png;base64,AAAA" };

beforeEach(() => {
  vi.useFakeTimers();
  resetChatEnvironment();
});

afterEach(() => {
  stopControllers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("sending", () => {
  it("shows the message at once and sends it, ending the live typing indicator", () => {
    const { store, actions, signIn, sentAfterHello } = startController();
    const socket = signIn();
    actions.typed();
    actions.send("LIVE", "Hello", [FILE]);

    const [item] = store.get().threads.LIVE;
    expect(item).toMatchObject({ status: "sending", files: [FILE] });
    expect(item.message.body).toBe("Hello");
    expect(sentAfterHello(socket)).toEqual([
      { t: "typing", on: true },
      { t: "typing", on: false },
      { t: "send", clientId: item.key, channel: "LIVE", body: "Hello", files: [FILE] },
    ]);
  });

  it("asks the knowledge bot without touching the typing indicator", () => {
    const { store, actions, signIn, sentAfterHello } = startController();
    const socket = signIn();
    actions.send("KNOWLEDGE", "Pricing?", []);
    const [item] = store.get().threads.KNOWLEDGE;
    expect(sentAfterHello(socket)).toEqual([
      { t: "send", clientId: item.key, channel: "KNOWLEDGE", body: "Pricing?", files: [] },
    ]);
  });

  it("marks the message failed when it cannot go out", () => {
    const { store, actions } = startController();
    actions.send("KNOWLEDGE", "Anyone?", []);
    expect(store.get().threads.KNOWLEDGE[0].status).toBe("failed");
    expect(store.get().error).toBe("");
  });

  it("retries a failed message under the same client id", () => {
    const { store, actions, signIn, sentAfterHello } = startController();
    actions.send("LIVE", "Try again", []);
    const { key } = store.get().threads.LIVE[0];
    const socket = signIn();
    actions.retry("LIVE", key);
    expect(store.get().threads.LIVE[0].status).toBe("sending");
    expect(sentAfterHello(socket)).toEqual([
      { t: "send", clientId: key, channel: "LIVE", body: "Try again", files: [] },
    ]);
  });

  it("ignores a retry for a message that is gone", () => {
    const { store, actions, signIn, sentAfterHello } = startController();
    const socket = signIn();
    actions.retry("LIVE", "missing");
    expect(sentAfterHello(socket)).toEqual([]);
    expect(store.get().threads.LIVE).toEqual([]);
  });

  it("discards a message from its thread", () => {
    const { store, actions } = startController();
    actions.send("LIVE", "one", []);
    actions.send("LIVE", "two", []);
    const [first, second] = store.get().threads.LIVE;
    actions.discard("LIVE", first.key);
    expect(store.get().threads.LIVE).toEqual([second]);
  });
});

describe("typing", () => {
  it("says typing once, and stops after three seconds of quiet", () => {
    const { actions, signIn, sentAfterHello } = startController();
    const socket = signIn();
    actions.typed();
    vi.advanceTimersByTime(2_000);
    actions.typed();
    vi.advanceTimersByTime(2_999);
    expect(sentAfterHello(socket)).toEqual([{ t: "typing", on: true }]);
    vi.advanceTimersByTime(1);
    expect(sentAfterHello(socket)).toEqual([
      { t: "typing", on: true },
      { t: "typing", on: false },
    ]);
  });

  it("stops typing on request, and only once", () => {
    const { actions, signIn, sentAfterHello } = startController();
    const socket = signIn();
    actions.stopTyping();
    actions.typed();
    actions.stopTyping();
    actions.stopTyping();
    vi.advanceTimersByTime(5_000);
    expect(sentAfterHello(socket)).toEqual([
      { t: "typing", on: true },
      { t: "typing", on: false },
    ]);
  });

  it("sends nothing while the chat is closed", () => {
    const { actions, signIn, sentAfterHello } = startController();
    const socket = signIn("CLOSED");
    actions.typed();
    vi.advanceTimersByTime(3_000);
    expect(sentAfterHello(socket)).toEqual([]);
  });

  it("forgets a pending typing timeout when disposed", () => {
    const { actions, dispose, signIn, sentAfterHello } = startController();
    const socket = signIn();
    actions.typed();
    dispose();
    vi.advanceTimersByTime(3_000);
    expect(sentAfterHello(socket)).toEqual([{ t: "typing", on: true }]);
  });
});

describe("rating and ending", () => {
  it("sends feedback, end and new-chat requests", () => {
    const { actions, signIn, sentAfterHello } = startController();
    const socket = signIn();
    actions.rate("m-1", true);
    actions.endChat();
    actions.newChat();
    expect(sentAfterHello(socket)).toEqual([
      { t: "feedback", messageId: "m-1", helpful: true },
      { t: "end" },
      { t: "newChat" },
    ]);
  });

  it("says it is not connected when they cannot go out", () => {
    const { store, actions } = startController();
    actions.rate("m-1", false);
    expect(store.get().error).toBe(strings.notConnected);
    store.set({ error: "" });
    actions.endChat();
    expect(store.get().error).toBe(strings.notConnected);
    store.set({ error: "" });
    actions.newChat();
    expect(store.get().error).toBe(strings.notConnected);
  });
});
