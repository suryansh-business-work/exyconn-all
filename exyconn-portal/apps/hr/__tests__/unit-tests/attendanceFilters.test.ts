import { describe, it, expect } from 'vitest';
import { FilterOp } from '@exyconn/shell/graphql/generated';
import {
  EMPTY_ATTENDANCE_FILTERS,
  attendanceFilters,
  hasAttendanceFilters,
} from '../../src/pages/hr/attendance/attendance.filters';

describe('attendanceFilters', () => {
  it('sends nothing when no filter is set', () => {
    expect(attendanceFilters(EMPTY_ATTENDANCE_FILTERS)).toEqual([]);
    expect(hasAttendanceFilters(EMPTY_ATTENDANCE_FILTERS)).toBe(false);
  });

  it('sends each set filter as an EQUALS match', () => {
    const filters = attendanceFilters({
      ...EMPTY_ATTENDANCE_FILTERS,
      status: 'WFH',
      employeeId: 'emp-1',
      projectId: 'proj-1',
    });
    expect(filters).toEqual([
      { field: 'status', op: FilterOp.Equals, value: 'WFH' },
      { field: 'employeeId', op: FilterOp.Equals, value: 'emp-1' },
      { field: 'projectId', op: FilterOp.Equals, value: 'proj-1' },
    ]);
  });

  it('sends the picked calendar days, not an instant', () => {
    const filters = attendanceFilters({
      ...EMPTY_ATTENDANCE_FILTERS,
      from: new Date(2026, 8, 1, 23, 30),
      to: new Date(2026, 8, 30),
    });
    expect(filters.map((f) => [f.field, f.value])).toEqual([
      ['dateFrom', '2026-09-01'],
      ['dateTo', '2026-09-30'],
    ]);
  });

  it('ignores a half-typed date', () => {
    const filters = attendanceFilters({ ...EMPTY_ATTENDANCE_FILTERS, from: new Date('nope') });
    expect(filters).toEqual([]);
  });
});
