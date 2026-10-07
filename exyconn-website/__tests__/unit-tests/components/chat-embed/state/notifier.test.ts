// @vitest-environment jsdom
/** Read receipts when the visitor is looking; otherwise the unread badge, a nudge and a chime. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNotifier } from "../../../../../src/components/chat-embed/state/notifier";
import { createStore } from "../../../../../src/components/chat-embed/state/state";
import { chime } from "../../../../../src/components/chat-embed/lib/sound";
import { makeMessage, makeState } from "../chat-fixtures";

vi.mock("../../../../../src/components/chat-embed/lib/sound", () => ({ chime: vi.fn() }));

let visibility: DocumentVisibilityState = "visible";

function setVisibility(next: DocumentVisibilityState): void {
  visibility = next;
  document.dispatchEvent(new Event("visibilitychange"));
}

function setup(overrides: Parameters<typeof makeState>[0] = {}) {
  const store = createStore(makeState(overrides));
  const markRead = vi.fn();
  const notifier = createNotifier(store, markRead);
  return { store, markRead, notifier };
}

const reply = makeMessage({ sender: "AGENT", senderName: "Sam" });

beforeEach(() => {
  visibility = "visible";
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => visibility,
  });
  vi.mocked(chime).mockClear();
});

afterEach(() => {
  Reflect.deleteProperty(document, "visibilityState");
});

describe("createNotifier incoming", () => {
  it("ignores the visitor's own and system messages", () => {
    const { store, markRead, notifier } = setup({ open: false });
    notifier.incoming(makeMessage({ sender: "VISITOR" }));
    notifier.incoming(makeMessage({ sender: "SYSTEM" }));
    expect(markRead).not.toHaveBeenCalled();
    expect(store.get().unread).toBe(0);
  });

  it("marks a reply read when the visitor can see the panel", () => {
    const { store, markRead, notifier } = setup({ open: true });
    expect(notifier.seeing()).toBe(true);
    notifier.incoming(reply);
    expect(markRead).toHaveBeenCalledTimes(1);
    expect(store.get()).toMatchObject({ unread: 0, nudges: 0 });
  });

  it("counts an unseen reply, nudges and chimes when sound is on", () => {
    const { store, markRead, notifier } = setup({ open: false, soundOn: true, unread: 1 });
    notifier.incoming(reply);
    expect(store.get()).toMatchObject({ unread: 2, nudges: 1 });
    expect(chime).toHaveBeenCalledTimes(1);
    expect(markRead).not.toHaveBeenCalled();
  });

  it("stays quiet when sound is off", () => {
    const { store, notifier } = setup({ open: false, soundOn: false });
    notifier.incoming(makeMessage({ sender: "BOT" }));
    expect(store.get().unread).toBe(1);
    expect(chime).not.toHaveBeenCalled();
  });

  it("does not count the panel as seen while the tab is hidden", () => {
    const { store, notifier } = setup({ open: true });
    visibility = "hidden";
    expect(notifier.seeing()).toBe(false);
    notifier.incoming(reply);
    expect(store.get().unread).toBe(1);
  });
});

describe("createNotifier visibility", () => {
  it("clears the badge and marks read when the visitor comes back to the open panel", () => {
    const { store, markRead } = setup({ open: true, unread: 3 });
    setVisibility("hidden");
    expect(markRead).not.toHaveBeenCalled();
    setVisibility("visible");
    expect(store.get().unread).toBe(0);
    expect(markRead).toHaveBeenCalledTimes(1);
  });

  it("does nothing on return with no unread replies or a closed panel", () => {
    const { markRead } = setup({ open: true, unread: 0 });
    setVisibility("visible");
    const closed = setup({ open: false, unread: 2 });
    setVisibility("visible");
    expect(markRead).not.toHaveBeenCalled();
    expect(closed.markRead).not.toHaveBeenCalled();
    expect(closed.store.get().unread).toBe(2);
  });

  it("stops listening once disposed", () => {
    const { store, markRead, notifier } = setup({ open: true, unread: 2 });
    notifier.dispose();
    setVisibility("visible");
    expect(markRead).not.toHaveBeenCalled();
    expect(store.get().unread).toBe(2);
  });
});
