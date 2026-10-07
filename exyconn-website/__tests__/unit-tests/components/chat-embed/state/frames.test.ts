/** How each server frame changes the chat's state. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  handleFrame,
  type FrameContext,
} from "../../../../../src/components/chat-embed/state/frames";
import { createStore, type ChatState } from "../../../../../src/components/chat-embed/state/state";
import {
  readItem,
  removeItem,
  writeItem,
} from "../../../../../src/components/chat-embed/lib/storage";
import { makeConfig, makeItem, makeMessage, makeSession, makeState } from "../chat-fixtures";

vi.mock("../../../../../src/components/chat-embed/lib/storage", () => ({
  readItem: vi.fn(),
  writeItem: vi.fn(),
  removeItem: vi.fn(),
}));

const KEYS = { token: "exyconn-chat:WEBSITE:token", sound: "exyconn-chat:WEBSITE:sound" };

function setup(overrides: Partial<ChatState> = {}, seeing = false) {
  const store = createStore(makeState(overrides));
  const notifier = { incoming: vi.fn(), seeing: vi.fn(() => seeing), dispose: vi.fn() };
  const ctx: FrameContext = { store, keys: KEYS, notifier, markRead: vi.fn() };
  return { ctx, store, notifier };
}

beforeEach(() => {
  vi.mocked(readItem).mockReset().mockReturnValue(null);
  vi.mocked(writeItem).mockReset();
  vi.mocked(removeItem).mockReset();
});

describe("config frame", () => {
  it("uses the site's sound default until the visitor has chosen", () => {
    const { ctx, store } = setup({ open: true });
    const config = makeConfig({ soundEnabledByDefault: true });
    handleFrame(ctx, { t: "config", config, site: "WEBSITE" });
    expect(store.get()).toMatchObject({ config, soundOn: true, open: true });
    expect(readItem).toHaveBeenCalledWith(KEYS.sound);
  });

  it("keeps the visitor's own sound choice", () => {
    const { ctx, store } = setup();
    vi.mocked(readItem).mockReturnValue("off");
    handleFrame(ctx, {
      t: "config",
      config: makeConfig({ soundEnabledByDefault: true }),
      site: "WEBSITE",
    });
    expect(store.get().soundOn).toBe(false);
    vi.mocked(readItem).mockReturnValue("on");
    handleFrame(ctx, { t: "config", config: makeConfig(), site: "WEBSITE" });
    expect(store.get().soundOn).toBe(true);
  });

  it("closes the panel when the chat is switched off", () => {
    const { ctx, store } = setup({ open: true });
    handleFrame(ctx, { t: "config", config: makeConfig({ enabled: false }), site: "WEBSITE" });
    expect(store.get().open).toBe(false);
  });
});

describe("sign-in frames", () => {
  it("moves to the code step when the code is sent", () => {
    const { ctx, store } = setup({ busy: true, error: "old" });
    handleFrame(ctx, { t: "codeSent", email: "riya@example.com" });
    expect(store.get()).toMatchObject({ step: "code", busy: false, error: "" });
    expect(store.get().codeSentAt).toBeGreaterThan(0);
  });

  it("stores the pass and the history, counting unseen replies", () => {
    const failed = makeItem({ id: "local" }, { status: "failed" });
    const { ctx, store } = setup({ threads: { LIVE: [failed], KNOWLEDGE: [] }, busy: true });
    const session = makeSession();
    const messages = [makeMessage({ id: "a", sender: "AGENT" }), makeMessage({ id: "b" })];
    handleFrame(ctx, { t: "signedIn", token: "pass-1", session, messages });

    expect(writeItem).toHaveBeenCalledWith(KEYS.token, "pass-1");
    expect(store.get()).toMatchObject({ step: "signedIn", session, busy: false, unread: 1 });
    expect(store.get().threads.LIVE.map((item) => item.key)).toEqual(["a", "b", "local"]);
    expect(ctx.markRead).not.toHaveBeenCalled();
  });

  it("marks the history read at once when the visitor is looking", () => {
    const { ctx, store } = setup({}, true);
    const messages = [makeMessage({ sender: "BOT", channel: "KNOWLEDGE" })];
    handleFrame(ctx, { t: "signedIn", token: "p", session: makeSession(), messages });
    expect(store.get().unread).toBe(0);
    expect(ctx.markRead).toHaveBeenCalledTimes(1);
  });

  it("does not send a read receipt for a history with nothing unread", () => {
    const { ctx } = setup({}, true);
    handleFrame(ctx, { t: "signedIn", token: "p", session: makeSession(), messages: [] });
    expect(ctx.markRead).not.toHaveBeenCalled();
  });

  it("forgets the pass and the threads when signed out", () => {
    const { ctx, store } = setup({ step: "signedIn", session: makeSession(), unread: 4 });
    handleFrame(ctx, { t: "signedOut" });
    expect(removeItem).toHaveBeenCalledWith(KEYS.token);
    expect(store.get()).toMatchObject({
      step: "form",
      session: null,
      threads: { LIVE: [], KNOWLEDGE: [] },
      unread: 0,
    });
  });
});

describe("message frames", () => {
  it("adds a reply, clears that thread's typing and tells the notifier", () => {
    const { ctx, store, notifier } = setup({ typing: { LIVE: "Sam", KNOWLEDGE: "Exy" } });
    const message = makeMessage({ id: "r", sender: "AGENT" });
    handleFrame(ctx, { t: "message", message });
    expect(store.get().threads.LIVE).toHaveLength(1);
    expect(store.get().typing).toEqual({ LIVE: "", KNOWLEDGE: "Exy" });
    expect(notifier.incoming).toHaveBeenCalledWith(message);
  });

  it("swaps the visitor's echo in silently", () => {
    const optimistic = makeItem({ id: "c-1" }, { status: "sending" });
    const { ctx, store, notifier } = setup({
      threads: { LIVE: [optimistic], KNOWLEDGE: [] },
      typing: { LIVE: "Sam", KNOWLEDGE: "" },
    });
    handleFrame(ctx, { t: "message", message: makeMessage({ id: "s-1" }), clientId: "c-1" });
    expect(store.get().threads.LIVE[0]).toMatchObject({ key: "c-1", status: "sent" });
    expect(store.get().typing.LIVE).toBe("Sam");
    expect(notifier.incoming).not.toHaveBeenCalled();
  });

  it("does not notify twice for a reply it already shows", () => {
    const shown = makeItem({ id: "r", sender: "BOT", channel: "KNOWLEDGE" });
    const { ctx, notifier } = setup({ threads: { LIVE: [], KNOWLEDGE: [shown] } });
    handleFrame(ctx, { t: "message", message: shown.message });
    expect(notifier.incoming).not.toHaveBeenCalled();
  });

  it("swaps an updated message in place", () => {
    const shown = makeItem({ id: "r", sender: "BOT" });
    const { ctx, store } = setup({ threads: { LIVE: [shown], KNOWLEDGE: [] } });
    handleFrame(ctx, { t: "messageUpdated", message: { ...shown.message, feedback: "DOWN" } });
    expect(store.get().threads.LIVE[0].message.feedback).toBe("DOWN");
  });

  it("stamps the visitor's live messages as read", () => {
    const mine = makeItem({ id: "v", sender: "VISITOR" });
    const { ctx, store } = setup({ threads: { LIVE: [mine], KNOWLEDGE: [] } });
    handleFrame(ctx, { t: "read", by: "AGENT", at: "2026-10-07T10:00:00.000Z" });
    expect(store.get().threads.LIVE[0].message.readAt).toBe("2026-10-07T10:00:00.000Z");
  });
});
