import type { ChatMessage } from '@exyconn/wa-flow';

export type TimelineRow =
  | { kind: 'date'; id: string; dayMs: number }
  | { kind: 'message'; id: string; message: ChatMessage; tail: boolean };

function dayOf(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Messages with a date chip at each new day, and the tail only on the first of a run. */
export function timeline(messages: readonly ChatMessage[]): TimelineRow[] {
  const rows: TimelineRow[] = [];
  let lastDay = -1;
  let lastFrom = '';
  for (const message of messages) {
    const day = dayOf(message.at);
    if (day !== lastDay) {
      rows.push({ kind: 'date', id: `day-${day}`, dayMs: day });
      lastDay = day;
      lastFrom = '';
    }
    const from = message.content.type === 'system' ? 'system' : message.from;
    rows.push({ kind: 'message', id: message.id, message, tail: from !== lastFrom });
    lastFrom = from;
  }
  return rows;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today / Yesterday, or null for an older day (the caller formats it). */
export function relativeDay(dayMs: number, now: number): 'Today' | 'Yesterday' | null {
  const today = dayOf(now);
  if (dayMs === today) {
    return 'Today';
  }
  return dayMs === today - DAY_MS ? 'Yesterday' : null;
}
