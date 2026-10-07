import { AttendanceStatus } from '@exyconn/shell/graphql/generated';
import type { AttendanceEntryRow } from '../../../../../src/pages/hr/attendance/attendance-grid';

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/** A tracked day: two projects (one without a project picked), times and a note. */
export const trackedDay: AttendanceEntryRow = {
  id: 'att-1',
  employeeId: 'u1',
  employeeName: 'Asha Rao',
  employeeEmail: 'asha@example.com',
  designation: 'Engineer',
  department: 'Engineering',
  date: '2026-03-04T12:00:00.000Z',
  status: AttendanceStatus.Present,
  note: 'Client visit',
  tracker: {
    activeMs: 6 * HOUR + 30 * MINUTE,
    idleMs: 30 * MINUTE,
    manualMs: 45 * MINUTE,
    sessions: 3,
    firstStartedAt: '2026-03-04T09:05:00.000Z',
    lastEndedAt: '2026-03-04T17:40:00.000Z',
    projects: [
      {
        projectId: 'p1',
        projectName: 'Website',
        activeMs: 5 * HOUR,
        manualMs: 0,
        sessions: 2,
      },
      { projectId: '', projectName: '', activeMs: 90 * MINUTE, manualMs: 45 * MINUTE, sessions: 1 },
    ],
  },
};

/** A day nothing was tracked and nothing optional was filled in. */
export const emptyDay: AttendanceEntryRow = {
  id: 'att-2',
  employeeId: 'u2',
  employeeName: 'Bilal Khan',
  employeeEmail: '',
  designation: null,
  department: null,
  date: '2026-03-05T12:00:00.000Z',
  status: AttendanceStatus.Absent,
  note: null,
  tracker: {
    activeMs: 0,
    idleMs: 0,
    manualMs: 0,
    sessions: 0,
    firstStartedAt: null,
    lastEndedAt: null,
    projects: [],
  },
};
