import type { LiveSegment } from '../../../../types/meeting';

/** Consecutive lines of one speaker, shown under one name and time. */
export interface SpeakerGroup {
  id: string;
  speakerLabel: string | null;
  startMs: number;
  lines: LiveSegment[];
}

/** mm:ss from the meeting start. */
export function clock(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** This browser's fresh lines and the portal's, one per id, in spoken order. */
export function mergeLines(
  local: readonly LiveSegment[],
  remote: readonly LiveSegment[],
): LiveSegment[] {
  const byId = new Map<string, LiveSegment>();
  for (const line of [...remote, ...local]) {
    byId.set(line.id, line);
  }
  return [...byId.values()].sort((a, b) => a.startMs - b.startMs);
}

/** Runs of the same speaker become one group, as a chat shows them. */
export function groupBySpeaker(lines: readonly LiveSegment[]): SpeakerGroup[] {
  const groups: SpeakerGroup[] = [];
  for (const line of lines) {
    const last = groups.at(-1);
    if (last?.speakerLabel === line.speakerLabel) {
      last.lines.push(line);
    } else {
      groups.push({
        id: line.id,
        speakerLabel: line.speakerLabel,
        startMs: line.startMs,
        lines: [line],
      });
    }
  }
  return groups;
}
