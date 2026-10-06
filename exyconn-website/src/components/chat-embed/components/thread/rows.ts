import { dayKey, dayLabel } from "../../lib/time";
import type { ThreadItem } from "../../state/state";
import { strings } from "../../strings";

export type Row =
  | { kind: "day"; key: string; label: string }
  | { kind: "message"; key: string; item: ThreadItem; first: boolean; last: boolean };

const GROUP_GAP_MS = 5 * 60_000;

/** Whether two neighbouring messages read as one group (same sender, same day, close in time). */
function sameGroup(a: Readonly<ThreadItem>, b: Readonly<ThreadItem>): boolean {
  return (
    a.message.sender === b.message.sender &&
    a.message.senderName === b.message.senderName &&
    dayKey(a.message.createdAt) === dayKey(b.message.createdAt) &&
    Date.parse(b.message.createdAt) - Date.parse(a.message.createdAt) < GROUP_GAP_MS
  );
}

/** A thread as rows: a separator at each new day, and each message marked first/last of its group. */
export function threadRows(items: readonly ThreadItem[]): Row[] {
  const rows: Row[] = [];
  items.forEach((item, index) => {
    const previous = items[index - 1];
    const next = items[index + 1];
    const day = dayKey(item.message.createdAt);
    if (!previous || dayKey(previous.message.createdAt) !== day) {
      const label = dayLabel(item.message.createdAt, strings);
      rows.push({ kind: "day", key: `day-${day}`, label });
    }
    rows.push({
      kind: "message",
      key: item.key,
      item,
      first: !previous || !sameGroup(previous, item),
      last: !next || !sameGroup(item, next),
    });
  });
  return rows;
}

/** The key of the visitor's last live message the team has read, for the "Seen" mark. */
export function lastSeenKey(items: readonly ThreadItem[]): string | null {
  const last = items.findLast((item) => item.message.sender === "VISITOR");
  return last?.message.readAt ? last.key : null;
}
