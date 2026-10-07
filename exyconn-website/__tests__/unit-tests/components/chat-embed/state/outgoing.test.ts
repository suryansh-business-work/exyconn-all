/** The visitor's optimistic bubble and the frame that sends it. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { optimisticItem, sendFrame } from "../../../../../src/components/chat-embed/state/outgoing";
import { makeSession } from "../chat-fixtures";

const FILE = { name: "photo.png", data: "data:image/png;base64,AAAA" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("optimisticItem", () => {
  it("shows the visitor's message at once, keyed by a fresh client id", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-07T08:00:00.000Z"));
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" });

    const item = optimisticItem("LIVE", "Hello", [FILE], makeSession({ id: "s-9", name: "Riya" }));

    expect(item).toEqual({
      key: "uuid-1",
      status: "sending",
      files: [FILE],
      message: {
        id: "uuid-1",
        sessionId: "s-9",
        channel: "LIVE",
        sender: "VISITOR",
        senderName: "Riya",
        body: "Hello",
        attachments: [{ url: FILE.data, name: "photo.png", kind: "IMAGE", size: 0 }],
        sources: [],
        suggestions: [],
        feedback: null,
        createdAt: "2026-10-07T08:00:00.000Z",
        readAt: null,
      },
    });
  });

  it("works before a session exists", () => {
    const item = optimisticItem("KNOWLEDGE", "Pricing?", [], null);
    expect(item.message).toMatchObject({ sessionId: "", senderName: "", channel: "KNOWLEDGE" });
    expect(item.key).toBe(item.message.id);
    expect(item.key.length).toBeGreaterThan(0);
  });

  it("builds the id from random bytes where randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(0xab),
    });
    expect(optimisticItem("LIVE", "x", [], null).key).toBe("ab".repeat(16));
  });

  it("gives every message its own id", () => {
    const first = optimisticItem("LIVE", "a", [], null).key;
    const second = optimisticItem("LIVE", "b", [], null).key;
    expect(first).not.toBe(second);
  });
});

describe("sendFrame", () => {
  it("carries the client id, thread, body and files", () => {
    const item = optimisticItem("LIVE", "Hello", [FILE], null);
    expect(sendFrame(item)).toEqual({
      t: "send",
      clientId: item.key,
      channel: "LIVE",
      body: "Hello",
      files: [FILE],
    });
  });
});
