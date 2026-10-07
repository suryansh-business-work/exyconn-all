/** A thread as rows: day separators, message groups, and the "Seen" mark. */
import { describe, expect, it } from "vitest";
import {
  lastSeenKey,
  threadRows,
  type Row,
} from "../../../../../../src/components/chat-embed/components/thread/rows";
import { dayLabel } from "../../../../../../src/components/chat-embed/lib/time";
import type { Sender } from "../../../../../../src/components/chat-embed/types";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { makeItem } from "../../chat-fixtures";

/** A local time on a fixed day, so the day boundaries hold in any timezone. */
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 8, day, hour, minute).toISOString();

const item = (id: string, sender: Sender, createdAt: string, senderName = "Riya") =>
  makeItem({ id, sender, senderName, createdAt });

/** The message rows as [key, first, last]. */
const groups = (rows: Row[]) =>
  rows.flatMap((row) => (row.kind === "message" ? [[row.key, row.first, row.last]] : []));

describe("threadRows", () => {
  it("is empty for an empty thread", () => {
    expect(threadRows([])).toEqual([]);
  });

  it("opens the thread with its day and keeps a lone message as its own group", () => {
    const only = item("a", "VISITOR", at(10, 9));
    const rows = threadRows([only]);
    expect(rows[0]).toEqual({
      kind: "day",
      key: `day-${new Date(only.message.createdAt).toDateString()}`,
      label: dayLabel(only.message.createdAt, strings),
    });
    expect(rows[1]).toEqual({ kind: "message", key: "a", item: only, first: true, last: true });
  });

  it("groups a run from one sender within five minutes", () => {
    const rows = threadRows([
      item("a", "VISITOR", at(10, 9, 0)),
      item("b", "VISITOR", at(10, 9, 2)),
      item("c", "VISITOR", at(10, 9, 4)),
    ]);
    expect(groups(rows)).toEqual([
      ["a", true, false],
      ["b", false, false],
      ["c", false, true],
    ]);
    expect(rows.filter((row) => row.kind === "day")).toHaveLength(1);
  });

  it("starts a new group after a five-minute gap", () => {
    const rows = threadRows([
      item("a", "VISITOR", at(10, 9, 0)),
      item("b", "VISITOR", at(10, 9, 5)),
    ]);
    expect(groups(rows)).toEqual([
      ["a", true, true],
      ["b", true, true],
    ]);
  });

  it("starts a new group for another sender, or another name from the same kind", () => {
    const rows = threadRows([
      item("a", "VISITOR", at(10, 9, 0)),
      item("b", "AGENT", at(10, 9, 1), "Ana"),
      item("c", "AGENT", at(10, 9, 2), "Raj"),
    ]);
    expect(groups(rows)).toEqual([
      ["a", true, true],
      ["b", true, true],
      ["c", true, true],
    ]);
  });

  it("puts a separator at each new day and never groups across it", () => {
    const rows = threadRows([
      item("a", "VISITOR", at(10, 23, 58)),
      item("b", "VISITOR", at(11, 0, 1)),
    ]);
    expect(rows.map((row) => row.kind)).toEqual(["day", "message", "day", "message"]);
    expect(groups(rows)).toEqual([
      ["a", true, true],
      ["b", true, true],
    ]);
  });
});

describe("lastSeenKey", () => {
  it("is the visitor's last message once the team has read it", () => {
    const items = [
      makeItem({ id: "v1", readAt: "2026-09-10T09:00:00.000Z" }),
      makeItem({ id: "v2", readAt: "2026-09-10T09:05:00.000Z" }),
      makeItem({ id: "a1", sender: "AGENT", senderName: "Ana" }),
    ];
    expect(lastSeenKey(items)).toBe("v2");
  });

  it("is null while the visitor's last message is unread", () => {
    const items = [
      makeItem({ id: "v1", readAt: "2026-09-10T09:00:00.000Z" }),
      makeItem({ id: "v2" }),
    ];
    expect(lastSeenKey(items)).toBeNull();
  });

  it("is null when the visitor has not written", () => {
    expect(lastSeenKey([makeItem({ id: "a1", sender: "AGENT", senderName: "Ana" })])).toBeNull();
    expect(lastSeenKey([])).toBeNull();
  });
});
