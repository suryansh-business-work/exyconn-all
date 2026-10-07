/** Thread bookkeeping: history, echoes, retries, failures, read receipts and unread counts. */
import { describe, expect, it } from "vitest";
import {
  countUnread,
  failOne,
  failPending,
  isReply,
  markVisitorRead,
  mergeHistory,
  replaceMessage,
  upsertMessage,
  withStatus,
} from "../../../../../src/components/chat-embed/state/threads";
import type { Threads } from "../../../../../src/components/chat-embed/state/state";
import { makeItem, makeMessage } from "../chat-fixtures";

const READ_AT = "2026-10-07T10:00:00.000Z";

describe("mergeHistory", () => {
  it("splits the history by thread and keeps local bubbles that never arrived", () => {
    const failed = makeItem({ id: "local", body: "retry me" }, { status: "failed" });
    const local: Threads = {
      LIVE: [failed, makeItem({ id: "old" }), makeItem({ id: "s" }, { status: "sending" })],
      KNOWLEDGE: [],
    };
    const history = [
      makeMessage({ id: "a" }),
      makeMessage({ id: "b", channel: "KNOWLEDGE", sender: "BOT" }),
    ];
    const merged = mergeHistory(history, local);
    expect(merged.LIVE.map((item) => item.key)).toEqual(["a", "local"]);
    expect(merged.KNOWLEDGE.map((item) => item.key)).toEqual(["b"]);
    expect(merged.KNOWLEDGE[0]).toMatchObject({ status: "sent", files: [] });
  });
});

describe("upsertMessage", () => {
  it("adds a new message under its id", () => {
    const { items, added } = upsertMessage([], makeMessage({ id: "m" }));
    expect(added).toBe(true);
    expect(items).toEqual([expect.objectContaining({ key: "m", status: "sent" })]);
  });

  it("adds a message under the clientId it was sent with", () => {
    const { items } = upsertMessage([], makeMessage({ id: "server-1" }), "client-1");
    expect(items[0].key).toBe("client-1");
  });

  it("swaps the optimistic bubble for the server's echo, keeping its key", () => {
    const optimistic = makeItem({ id: "client-1", body: "hi" }, { status: "sending" });
    const echo = makeMessage({ id: "server-1", body: "hi" });
    const { items, added } = upsertMessage([optimistic], echo, "client-1");
    expect(added).toBe(false);
    expect(items).toEqual([{ key: "client-1", message: echo, status: "sent", files: [] }]);
  });

  it("replaces a copy already shown with the same id", () => {
    const shown = makeItem({ id: "m", body: "old" });
    const { items, added } = upsertMessage([shown], makeMessage({ id: "m", body: "new" }));
    expect(added).toBe(false);
    expect(items[0].message.body).toBe("new");
  });
});

describe("replaceMessage / withStatus", () => {
  it("swaps a changed message wherever it is shown", () => {
    const threads: Threads = {
      LIVE: [makeItem({ id: "x" })],
      KNOWLEDGE: [makeItem({ id: "y", channel: "KNOWLEDGE" })],
    };
    const changed = makeMessage({ id: "y", channel: "KNOWLEDGE", feedback: "UP" });
    const next = replaceMessage(threads, changed);
    expect(next.KNOWLEDGE[0].message.feedback).toBe("UP");
    expect(next.LIVE[0]).toBe(threads.LIVE[0]);
  });

  it("sets one bubble's status and clears its old error", () => {
    const items = [
      makeItem({ id: "a" }, { status: "failed", error: "too big" }),
      makeItem({ id: "b" }),
    ];
    const next = withStatus(items, "a", "sending");
    expect(next[0]).toMatchObject({ status: "sending", error: undefined });
    expect(next[1]).toBe(items[1]);
  });
});

describe("failOne / failPending", () => {
  it("marks only the named message failed, with the reason", () => {
    const threads: Threads = {
      LIVE: [
        makeItem({ id: "a" }, { status: "sending" }),
        makeItem({ id: "b" }, { status: "sending" }),
      ],
      KNOWLEDGE: [makeItem({ id: "c", channel: "KNOWLEDGE" }, { status: "sending" })],
    };
    const next = failOne(threads, "c", "File too large");
    expect(next.KNOWLEDGE[0]).toMatchObject({ status: "failed", error: "File too large" });
    expect(next.LIVE.map((item) => item.status)).toEqual(["sending", "sending"]);
  });

  it("marks every bubble still waiting for the server failed", () => {
    const threads: Threads = {
      LIVE: [makeItem({ id: "a" }, { status: "sending" }), makeItem({ id: "b" })],
      KNOWLEDGE: [makeItem({ id: "c", channel: "KNOWLEDGE" }, { status: "sending" })],
    };
    const next = failPending(threads);
    expect(next.LIVE.map((item) => item.status)).toEqual(["failed", "sent"]);
    expect(next.KNOWLEDGE[0].status).toBe("failed");
  });
});

describe("markVisitorRead", () => {
  it("stamps the visitor's unread messages and leaves the rest", () => {
    const items = [
      makeItem({ id: "a", sender: "VISITOR" }),
      makeItem({ id: "b", sender: "VISITOR", readAt: "2026-10-01T00:00:00.000Z" }),
      makeItem({ id: "c", sender: "AGENT" }),
    ];
    const next = markVisitorRead(items, READ_AT);
    expect(next.map((item) => item.message.readAt)).toEqual([
      READ_AT,
      "2026-10-01T00:00:00.000Z",
      null,
    ]);
    expect(next[2]).toBe(items[2]);
  });
});

describe("isReply / countUnread", () => {
  it("treats agent and bot messages as replies", () => {
    expect(isReply(makeMessage({ sender: "AGENT" }))).toBe(true);
    expect(isReply(makeMessage({ sender: "BOT" }))).toBe(true);
    expect(isReply(makeMessage({ sender: "VISITOR" }))).toBe(false);
    expect(isReply(makeMessage({ sender: "SYSTEM" }))).toBe(false);
  });

  it("counts the replies the visitor has not seen", () => {
    expect(
      countUnread([
        makeMessage({ sender: "AGENT" }),
        makeMessage({ sender: "BOT", readAt: READ_AT }),
        makeMessage({ sender: "BOT" }),
        makeMessage({ sender: "VISITOR" }),
        makeMessage({ sender: "SYSTEM" }),
      ])
    ).toBe(2);
    expect(countUnread([])).toBe(0);
  });
});
