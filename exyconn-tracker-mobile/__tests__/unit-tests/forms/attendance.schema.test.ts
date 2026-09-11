import { describe, expect, it } from 'vitest';
import { ATTENDANCE_OPTIONS } from '@exyconn/tracker-core';
import {
  ATTENDANCE_NOTE_MAX,
  attendanceSchema,
} from '../../../src/forms/attendance/attendance.schema';

function errorsOf(input: unknown): Record<string, string> {
  const result = attendanceSchema.safeParse(input);
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

describe('attendanceSchema', () => {
  it('accepts every status the tracker offers, with no note', () => {
    for (const option of ATTENDANCE_OPTIONS) {
      expect(errorsOf({ status: option.value, note: '' })).toEqual({});
    }
  });

  it('refuses a status the tracker does not offer', () => {
    expect(errorsOf({ status: 'SICK', note: '' }).status).toBe('Choose how you are working today.');
    expect(errorsOf({ status: 42, note: '' }).status).toBe('Choose how you are working today.');
  });

  it('trims the note', () => {
    const parsed = attendanceSchema.parse({ status: 'WFH', note: '  dentist at 4  ' });
    expect(parsed.note).toBe('dentist at 4');
  });

  it('holds the note to the portal form limit', () => {
    expect(errorsOf({ status: 'PRESENT', note: 'a'.repeat(ATTENDANCE_NOTE_MAX) })).toEqual({});
    expect(errorsOf({ status: 'PRESENT', note: 'a'.repeat(ATTENDANCE_NOTE_MAX + 1) }).note).toBe(
      `Keep the note under ${ATTENDANCE_NOTE_MAX} characters.`,
    );
  });

  it('counts the limit after trimming', () => {
    const padded = ` ${'a'.repeat(ATTENDANCE_NOTE_MAX)} `;
    expect(errorsOf({ status: 'PRESENT', note: padded })).toEqual({});
  });

  it('requires the note to be text', () => {
    expect(errorsOf({ status: 'PRESENT', note: null }).note).toBeDefined();
  });
});
