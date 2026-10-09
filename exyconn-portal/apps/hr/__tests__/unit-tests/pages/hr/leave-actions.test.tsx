import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveStatus } from '@exyconn/shell/graphql/generated';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { LeaveDecisionCell } from '../../../../src/pages/hr/leave-actions';
import type { LeaveRequestRow } from '../../../../src/pages/hr/forms/leave-request';
import { renderWithProviders } from '../../test-utils';

vi.mock('@exyconn/shell/auth/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/auth/AuthContext')>()),
  useAuth: vi.fn(),
}));

const row: LeaveRequestRow = {
  id: 'leave-1',
  employeeId: 'emp-7',
  type: 'SICK',
  fromDate: '2026-03-10T00:00:00.000Z',
  toDate: '2026-03-11T00:00:00.000Z',
  reason: 'Flu',
  status: LeaveStatus.Pending,
};

function signInAs(id: string | null) {
  const user = id ? { id, name: 'Viewer', email: 'viewer@example.com', roles: ['HR'] } : null;
  vi.mocked(useAuth).mockReturnValue({ user } as never);
}

/** Renders the cell inside a clickable row, as the leave table does. */
function renderCell(target: LeaveRequestRow, onDecide = vi.fn().mockResolvedValue(undefined)) {
  const onRowClick = vi.fn();
  renderWithProviders(
    <table>
      <thead>
        <tr>
          <th scope="col">Decision</th>
        </tr>
      </thead>
      <tbody>
        <tr onClick={onRowClick}>
          <td>
            <LeaveDecisionCell row={target} onDecide={onDecide} />
          </td>
        </tr>
      </tbody>
    </table>,
  );
  return { onDecide, onRowClick };
}

beforeEach(() => {
  signInAs('hr-1');
});

describe('LeaveDecisionCell', () => {
  it('shows nothing for a request that is already decided', () => {
    renderCell({ ...row, status: LeaveStatus.Approved });
    expect(screen.queryByRole('button', { name: 'approve leave' })).not.toBeInTheDocument();
    expect(screen.queryByText('HR or your manager decides')).not.toBeInTheDocument();
  });

  it('never offers somebody a decision on their own leave', () => {
    signInAs('emp-7');
    renderCell(row);
    expect(screen.getByText('HR or your manager decides')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'approve leave' })).not.toBeInTheDocument();
  });

  it('offers the decision when nobody is signed in to compare against', () => {
    signInAs(null);
    renderCell(row);
    expect(screen.getByRole('button', { name: 'reject leave' })).toBeInTheDocument();
  });

  it('approves without opening the employee behind the row', async () => {
    const { onDecide, onRowClick } = renderCell(row);
    await userEvent.click(screen.getByRole('button', { name: 'approve leave' }));
    expect(onDecide).toHaveBeenCalledWith(row, LeaveStatus.Approved);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('rejects the request', async () => {
    const { onDecide } = renderCell(row);
    await userEvent.click(screen.getByRole('button', { name: 'reject leave' }));
    expect(onDecide).toHaveBeenCalledWith(row, LeaveStatus.Rejected);
  });

  it('logs a decision that failed instead of leaving the rejection unhandled', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    const failure = new Error('Server refused');
    renderCell(row, vi.fn().mockRejectedValue(failure));
    await userEvent.click(screen.getByRole('button', { name: 'approve leave' }));
    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith('Deciding a leave request failed', failure),
    );
    logged.mockRestore();
  });
});
