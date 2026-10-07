/** Typing indicators, session updates, errors and pongs from the server. */
import { describe, expect, it, vi } from "vitest";
import {
  handleFrame,
  type FrameContext,
} from "../../../../../src/components/chat-embed/state/frames";
import { createStore, type ChatState } from "../../../../../src/components/chat-embed/state/state";
import { makeItem, makeSession, makeState } from "../chat-fixtures";

vi.mock("../../../../../src/components/chat-embed/lib/storage", () => ({
  readItem: vi.fn(() => null),
  writeItem: vi.fn(),
  removeItem: vi.fn(),
}));

function setup(overrides: Partial<ChatState> = {}) {
  const store = createStore(makeState(overrides));
  const notifier = { incoming: vi.fn(), seeing: vi.fn(() => false), dispose: vi.fn() };
  const ctx: FrameContext = {
    store,
    keys: { token: "t", sound: "s" },
    notifier,
    markRead: vi.fn(),
  };
  return { ctx, store };
}

describe("typing frame", () => {
  it("shows the team typing in the live thread", () => {
    const { ctx, store } = setup();
    handleFrame(ctx, { t: "typing", who: "AGENT", name: "Sam", on: true, channel: "KNOWLEDGE" });
    expect(store.get().typing).toEqual({ LIVE: "Sam", KNOWLEDGE: "" });
    handleFrame(ctx, { t: "typing", who: "AGENT", name: "Sam", on: false });
    expect(store.get().typing.LIVE).toBe("");
  });

  it("shows the bot in the thread it is answering, the knowledge thread by default", () => {
    const { ctx, store } = setup();
    handleFrame(ctx, { t: "typing", who: "BOT", name: "Exy", on: true, channel: "LIVE" });
    expect(store.get().typing).toEqual({ LIVE: "Exy", KNOWLEDGE: "" });
    handleFrame(ctx, { t: "typing", who: "BOT", name: "Exy", on: true });
    expect(store.get().typing).toEqual({ LIVE: "Exy", KNOWLEDGE: "Exy" });
  });
});

describe("session frame", () => {
  it("replaces the session", () => {
    const { ctx, store } = setup({ session: makeSession() });
    const closed = makeSession({ status: "CLOSED", closedAt: "2026-10-07T11:00:00.000Z" });
    handleFrame(ctx, { t: "session", session: closed });
    expect(store.get().session).toEqual(closed);
  });
});

describe("error frame", () => {
  it("marks only the message it names failed, with the reason", () => {
    const sending = makeItem({ id: "c-1" }, { status: "sending" });
    const { ctx, store } = setup({ busy: true, threads: { LIVE: [sending], KNOWLEDGE: [] } });
    handleFrame(ctx, { t: "error", message: "File too large", clientId: "c-1" });
    expect(store.get().threads.LIVE[0]).toMatchObject({
      status: "failed",
      error: "File too large",
    });
    expect(store.get()).toMatchObject({ busy: false, error: "" });
  });

  it("shows an error that names no message in the banner", () => {
    const { ctx, store } = setup({ busy: true });
    handleFrame(ctx, { t: "error", message: "Wrong code", code: "BAD_CODE" });
    expect(store.get()).toMatchObject({ busy: false, error: "Wrong code" });
  });
});

describe("pong frame", () => {
  it("changes nothing", () => {
    const { ctx, store } = setup();
    const before = store.get();
    handleFrame(ctx, { t: "pong" });
    expect(store.get()).toBe(before);
  });
});
