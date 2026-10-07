import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterOp, ListAttendancePagedDocument } from '@exyconn/shell/graphql/generated';
import { AttendanceListPage } from '../../../../src/pages/hr';
import { ATTENDANCE_COLUMNS } from '../../../../src/pages/hr/attendance/attendance-grid';
import { renderWithProviders } from '../../test-utils';
import { attendancePaged, attendanceProps } from './attendance/dashboard-stub';
import { trackedDay } from './attendance/attendance-fixture';

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('./attendance/dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.AttendanceDashboardStub,
    usePagedFetcher: stub.useAttendancePagedStub,
  };
});

vi.mock('../../../../src/pages/hr/attendance/AttendanceFilters', async () => ({
  AttendanceFilters: (await import('./attendance/filters-stub')).AttendanceFiltersStub,
}));

describe('AttendanceListPage', () => {
  it('drives the server grid with the paged query, the columns and the date formatter', () => {
    renderWithProviders(<AttendanceListPage />);
    const page = { totalCount: 1, rows: [trackedDay] };

    expect(attendancePaged.document).toBe(ListAttendancePagedDocument);
    expect(attendancePaged.select?.({ listAttendancePaged: page } as never)).toBe(page);
    expect(attendancePaged.extraFilters).toEqual([]);
    expect(attendanceProps()).toMatchObject({
      title: 'Attendance',
      entityLabel: 'attendance record',
      exportFileName: 'attendance',
      searchPlaceholder: 'Search by employee, email or note…',
      stats: [],
      refreshSignal: 0,
      columnDefs: ATTENDANCE_COLUMNS,
    });
    expect(attendanceProps().context.formatDate('2026-03-04T12:00:00.000Z')).toBe('04 Mar 2026');
  });

  it('sends a changed filter with every page request and re-reads the grid', async () => {
    renderWithProviders(<AttendanceListPage />);
    expect(screen.getByText('Status filter: any')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Only WFH' }));

    expect(screen.getByText('Status filter: WFH')).toBeInTheDocument();
    expect(attendancePaged.extraFilters).toEqual([
      { field: 'status', op: FilterOp.Equals, value: 'WFH' },
    ]);
    expect(attendanceProps().refreshSignal).toBe(1);
  });

  it('opens a day’s brief from the details action and closes it again', async () => {
    renderWithProviders(<AttendanceListPage />);
    expect(screen.queryByRole('heading', { name: 'Asha Rao' })).not.toBeInTheDocument();

    act(() => {
      attendanceProps().context.actions.details(trackedDay);
    });
    expect(await screen.findByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Client visit')).not.toBeInTheDocument();
  });

  it('opens a day’s brief from a row click too', async () => {
    renderWithProviders(<AttendanceListPage />);
    act(() => {
      attendanceProps().onRowClick(trackedDay as never);
    });
    expect(await screen.findByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
  });
});
