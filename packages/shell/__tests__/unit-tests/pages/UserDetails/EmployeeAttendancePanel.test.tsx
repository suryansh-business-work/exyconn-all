import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { AttendanceStatus, useAttendanceByEmployeeQuery } from '@/graphql/generated';
import { EmployeeAttendancePanel } from '@/pages/UserDetails/EmployeeAttendancePanel';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useAttendanceByEmployeeQuery: vi.fn(),
}));

function renderPanel(entries: unknown[] | undefined) {
  vi.mocked(useAttendanceByEmployeeQuery).mockReturnValue(
    queryResult(entries && { attendanceByEmployee: entries }) as never,
  );
  renderWithProviders(<EmployeeAttendancePanel employeeId="emp-1" />);
}

describe('EmployeeAttendancePanel', () => {
  it("asks for this employee's entries", () => {
    renderPanel([]);
    expect(useAttendanceByEmployeeQuery).toHaveBeenCalledWith({
      variables: { employeeId: 'emp-1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('No attendance recorded.')).toBeInTheDocument();
  });

  it('shows the status and note of each entry, with a dash for no note', () => {
    renderPanel([
      {
        id: 'a-1',
        employeeId: 'emp-1',
        date: '2026-05-04',
        status: AttendanceStatus.Present,
        note: 'On site',
      },
      {
        id: 'a-2',
        employeeId: 'emp-1',
        date: '2026-05-05',
        status: AttendanceStatus.Absent,
        note: null,
      },
    ]);

    const [, first, second] = screen.getAllByRole('row');
    expect(within(first).getByText('On site')).toBeInTheDocument();
    expect(within(first).getByText('PRESENT', { exact: false })).toBeInTheDocument();
    expect(within(second).getByText('—')).toBeInTheDocument();
  });

  it('shows nothing while no data has arrived', () => {
    renderPanel(undefined);
    expect(screen.getByText('No attendance recorded.')).toBeInTheDocument();
  });
});
