import { ATTENDANCE_OPTIONS, type AttendanceStatus } from '@exyconn/tracker-core';
import { z } from 'zod';

/** The same ceiling the employee portal's own "Mark attendance" form holds the note to. */
export const ATTENDANCE_NOTE_MAX = 200;

const offered = (value: unknown): boolean =>
  ATTENDANCE_OPTIONS.some((option) => option.value === value);

/**
 * Marking in for the day. The status must be one the tracker offers (the portal's own list,
 * from tracker-core); the note is optional, trimmed, and held to the portal form's limit.
 */
export const attendanceSchema = z.object({
  status: z.custom<AttendanceStatus>(offered, 'Choose how you are working today.'),
  note: z
    .string()
    .trim()
    .max(ATTENDANCE_NOTE_MAX, `Keep the note under ${ATTENDANCE_NOTE_MAX} characters.`),
});
