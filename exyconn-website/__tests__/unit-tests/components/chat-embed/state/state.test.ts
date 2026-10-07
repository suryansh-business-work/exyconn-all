/** The chat's initial state and the tiny store React reads it through. */
import { describe, expect, it, vi } from "vitest";
import {
  createStore,
  emptyThreads,
  initialState,
} from "../../../../../src/components/chat-embed/state/state";

describe("initialState", () => {
  it("starts closed, idle and signed out, with the sound preference given", () => {
    const state = initialState(true);
    expect(state).toMatchObject({
      open: false,
      connection: "idle",
      config: null,
      step: "form",
      identity: { name: "", email: "", phone: "" },
      busy: false,
      session: null,
      threads: { LIVE: [], KNOWLEDGE: [] },
      typing: { LIVE: "", KNOWLEDGE: "" },
      unread: 0,
      nudges: 0,
      error: "",
      soundOn: true,
    });
    expect(initialState(false).soundOn).toBe(false);
  });

  it("gives every caller its own empty threads", () => {
    expect(emptyThreads()).not.toBe(emptyThreads());
    expect(emptyThreads()).toEqual({ LIVE: [], KNOWLEDGE: [] });
  });
});

describe("createStore", () => {
  it("merges a patch into a new snapshot and tells every listener", () => {
    const store = createStore(initialState(false));
    const before = store.get();
    const first = vi.fn();
    const second = vi.fn();
    store.subscribe(first);
    store.subscribe(second);

    store.set({ open: true, unread: 3 });

    expect(store.get()).not.toBe(before);
    expect(store.get()).toMatchObject({ open: true, unread: 3, step: "form" });
    expect(before.open).toBe(false);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops telling a listener once it unsubscribes", () => {
    const store = createStore(initialState(false));
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.set({ busy: true });
    expect(listener).not.toHaveBeenCalled();
    expect(store.get().busy).toBe(true);
  });
});
