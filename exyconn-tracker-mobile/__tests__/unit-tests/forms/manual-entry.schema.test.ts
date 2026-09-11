import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MANUAL_ENTRY_LIMITS,
  manualEntrySchema,
} from '../../../src/forms/manual-entry/manual-entry.schema';

const NOW = Date.parse('2026-09-11T12:00:00.000Z');
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** An ISO instant `ms` before the pinned "now". */
function ago(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

function claim(overrides: Record<string, unknown> = {}) {
  return {
    projectId: 'p1',
    taskId: '',
    startedAt: ago(3 * HOUR),
    endedAt: ago(2 * HOUR),
    note: 'Client visit',
    ...overrides,
  };
}

function errorsOf(input: unknown): Record<string, string> {
  const result = manualEntrySchema.safeParse(input);
  if (result.success) {
    return {};
  }
  // React Hook Form shows the FIRST issue per field, so that is the one worth asserting on.
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    errors[String(issue.path[0])] ??= issue.message;
  }
  return errors;
}

describe('manualEntrySchema', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mirrors the portal limits', () => {
    expect(MANUAL_ENTRY_LIMITS).toEqual({
      minDurationMs: MINUTE,
      maxDurationMs: 16 * HOUR,
      maxBackdateMs: 90 * DAY,
    });
  });

  it('accepts an hour of past work, with or without a project or ticket', () => {
    expect(errorsOf(claim())).toEqual({});
    expect(errorsOf(claim({ projectId: '', taskId: '' }))).toEqual({});
    expect(errorsOf(claim({ taskId: 't1' }))).toEqual({});
  });

  it('asks for the window and the note', () => {
    expect(errorsOf(claim({ startedAt: '', endedAt: '', note: '  ' }))).toEqual({
      startedAt: 'When did the work start?',
      endedAt: 'When did it end?',
      note: 'Say what the time was for.',
    });
  });

  it('files the note trimmed', () => {
    expect(manualEntrySchema.parse(claim({ note: '  Site visit ' })).note).toBe('Site visit');
  });

  it('refuses a window that ends before, or as, it starts', () => {
    const backwards = claim({ startedAt: ago(HOUR), endedAt: ago(2 * HOUR) });
    expect(errorsOf(backwards).endedAt).toBe('The entry must end after it starts.');
    const empty = claim({ startedAt: ago(HOUR), endedAt: ago(HOUR) });
    expect(errorsOf(empty).endedAt).toBe('The entry must end after it starts.');
  });

  it('holds a claim to at least a minute', () => {
    const short = claim({ startedAt: ago(HOUR), endedAt: ago(HOUR - 59 * 1000) });
    expect(errorsOf(short).endedAt).toBe('An entry must cover at least a minute.');
    const minute = claim({ startedAt: ago(HOUR), endedAt: ago(HOUR - MINUTE) });
    expect(errorsOf(minute)).toEqual({});
  });

  it('holds a claim to at most 16 hours', () => {
    const sixteen = claim({ startedAt: ago(17 * HOUR), endedAt: ago(HOUR) });
    expect(errorsOf(sixteen)).toEqual({});
    const longer = claim({ startedAt: ago(17 * HOUR + 1000), endedAt: ago(HOUR) });
    expect(errorsOf(longer).endedAt).toBe(
      'One entry cannot cover more than 16 hours. Split it across days.',
    );
  });

  it('refuses time that has not been worked yet', () => {
    const future = claim({ startedAt: ago(HOUR), endedAt: new Date(NOW + MINUTE).toISOString() });
    expect(errorsOf(future).endedAt).toBe(
      'Off-computer time cannot be claimed before it has been worked.',
    );
  });

  it('refuses work more than 90 days back', () => {
    const old = claim({ startedAt: ago(90 * DAY + HOUR), endedAt: ago(90 * DAY) });
    expect(errorsOf(old)).toEqual({
      startedAt: 'Entries can only be claimed within 90 days of the work.',
    });
    const edge = claim({ startedAt: ago(90 * DAY), endedAt: ago(90 * DAY - HOUR) });
    expect(errorsOf(edge)).toEqual({});
  });

  it('reports the window even while the note is still missing', () => {
    const errors = errorsOf(claim({ startedAt: ago(HOUR), endedAt: ago(2 * HOUR), note: '' }));
    expect(errors).toEqual({
      endedAt: 'The entry must end after it starts.',
      note: 'Say what the time was for.',
    });
  });
});
