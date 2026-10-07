import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveStatus, useLeaveRequestsByEmployeeQuery } from '@/graphql/generated';
import { EmployeeLeavePanel } from '@/pages/UserDetails/EmployeeLeavePanel';
import { useLeaveDecision } from '@/hooks/useLeaveDecision';
import { portalLogger } from '@/logging/portalLogger';
import { makeUser, renderWithProviders } from '../../test-utils';
import { queryResult } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useLeaveRequestsByEmployeeQuery: vi.fn(),
}));
vi.mock('@/hooks/useLeaveDecision', () => ({ useLeaveDecision: vi.fn() }));
vi.mock('@/logging/portalLogger', () => ({ portalLogger: { error: vi.fn(), warn: vi.fn() } }));

const decide = vi.fn();
const pending = {
  id: 'lr-1',
  employeeId: 'emp-1',
  type: 'CASUAL',
  fromDate: '2026-05-04',
  toDate: '2026-05-05',
  reason: 'Family visit',
  status: LeaveStatus.Pending,
};
const approved = { ...pending, id: 'lr-2', reason: 'Wedding', status: LeaveStatus.Approved };

function renderPanel(viewerId: string, requests: unknown[] | null = [pending, approved]) {
  const result = queryResult(requests ? { leaveRequestsByEmployee: requests } : undefined);
  vi.mocked(useLeaveRequestsByEmployeeQuery).mockReturnValue(result as never);
  renderWithProviders(<EmployeeLeavePanel employeeId="emp-1" />, {
    user: makeUser({ id: viewerId, roles: ['HR'] }),
  });
  return result;
}

const rowOf = (reason: string) => screen.getByText(reason).closest('tr') as HTMLElement;

beforeEach(() => {
  decide.mockReset().mockResolvedValue(undefined);
  vi.mocked(useLeaveDecision).mockReturnValue(decide);
});

describe('EmployeeLeavePanel', () => {
  it("lists the employee's requests and decides with the query's own reload", () => {
    const result = renderPanel('hr-1');
    expect(useLeaveDecision).toHaveBeenCalledWith(result.refetch);
    expect(screen.getByText('Family visit')).toBeInTheDocument();
    expect(screen.getByText('Wedding')).toBeInTheDocument();
  });

  it('says so when there are no requests', () => {
    renderPanel('hr-1', null);
    expect(screen.getByText('No leave requests.')).toBeInTheDocument();
  });

  it('offers approve and reject only on pending requests', () => {
    renderPanel('hr-1');
    expect(
      within(rowOf('Family visit')).getByRole('button', { name: 'approve leave' }),
    ).toBeInTheDocument();
    expect(within(rowOf('Wedding')).queryByRole('button', { name: 'approve leave' })).toBeNull();
    expect(within(rowOf('Wedding')).queryByRole('button', { name: 'reject leave' })).toBeNull();
  });

  it('approves and rejects through the shared decision', async () => {
    renderPanel('hr-1');
    const row = within(rowOf('Family visit'));
    await userEvent.click(row.getByRole('button', { name: 'approve leave' }));
    await userEvent.click(row.getByRole('button', { name: 'reject leave' }));

    expect(decide).toHaveBeenNthCalledWith(1, pending, LeaveStatus.Approved);
    expect(decide).toHaveBeenNthCalledWith(2, pending, LeaveStatus.Rejected);
  });

  it('logs a decision that throws', async () => {
    const failure = new Error('decision crashed');
    decide.mockRejectedValueOnce(failure);
    renderPanel('hr-1');
    await userEvent.click(
      within(rowOf('Family visit')).getByRole('button', { name: 'reject leave' }),
    );
    await expect
      .poll(() => vi.mocked(portalLogger.error).mock.calls.at(-1))
      .toEqual(['Deciding a leave request failed', failure]);
  });

  it('never lets somebody decide their own leave', () => {
    renderPanel('emp-1');
    expect(
      screen.getByText('These are your own requests. HR or your manager approves them — not you.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'approve leave' })).toBeNull();
  });
});
