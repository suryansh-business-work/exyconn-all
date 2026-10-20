import type { LiveSegment } from '../types/meeting';

/** Lines kept per meeting for the panel; older ones are re-read from the portal on demand. */
const MAX_LINES = 300;

/**
 * Transcript lines returned by this worker's own uploads, held in memory only (never in
 * storage, never in logs). Lost when the worker sleeps; the panel then reads them back from
 * maTranscript.
 */
const lines = new Map<string, LiveSegment[]>();

export function addLiveSegments(meetingId: string, segments: readonly LiveSegment[]): void {
  if (segments.length === 0) {
    return;
  }
  const byId = new Map((lines.get(meetingId) ?? []).map((line) => [line.id, line]));
  for (const segment of segments) {
    byId.set(segment.id, segment);
  }
  const sorted = [...byId.values()].sort((a, b) => a.startMs - b.startMs);
  lines.set(meetingId, sorted.slice(-MAX_LINES));
}

export function liveSegments(meetingId: string): LiveSegment[] {
  return lines.get(meetingId) ?? [];
}

export function forgetLiveSegments(meetingId: string): void {
  lines.delete(meetingId);
}
