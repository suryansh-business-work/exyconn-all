import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useDeleteLeaveBalanceMutation,
  useEmployeeLeaveBalancesQuery,
  useListLeavePoliciesQuery,
} from '@/graphql/generated';
import { useEmployeeLeaveBalances } from '@/pages/UserDetails/useEmployeeLeaveBalances';
import { HookWrapper } from '../hookWrapper';
import { mutationTuple, queryResult } from '../hookMocks';
import { makeBalance, makePolicy } from './leaveFixtures';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useEmployeeLeaveBalancesQuery: vi.fn(),
  useListLeavePoliciesQuery: vi.fn(),
  useDeleteLeaveBalanceMutation: vi.fn(),
}));

const deleteBalance = vi.fn();
const held = makeBalance();

function mockData(balances: unknown, policies: unknown, extras = {}) {
  const result = queryResult(balances && { employeeLeaveBalances: balances }, extras);
  vi.mocked(useEmployeeLeaveBalancesQuery).mockReturnValue(result);
  vi.mocked(useListLeavePoliciesQuery).mockReturnValue(
    queryResult(policies && { listLeavePolicies: policies }) as never,
  );
  return result;
}

const renderBalances = () =>
  renderHook(() => useEmployeeLeaveBalances('emp-1', 2026), { wrapper: HookWrapper });

/** Starts a removal, confirms it and waits for the hook to finish. */
async function confirmRemoval() {
  const { result } = renderBalances();
  let done: Promise<void> = Promise.resolve();
  act(() => {
    done = result.current.remove(held);
  });
  await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
  await act(async () => done);
}

beforeEach(() => {
  deleteBalance.mockReset().mockResolvedValue({ data: { deleteLeaveBalance: true } });
  vi.mocked(useDeleteLeaveBalanceMutation).mockReturnValue(mutationTuple(deleteBalance) as never);
});

describe('useEmployeeLeaveBalances', () => {
  it('asks for this employee and year', () => {
    mockData([], []);
    renderBalances();
    expect(useEmployeeLeaveBalancesQuery).toHaveBeenCalledWith({
      variables: { employeeId: 'emp-1', year: 2026 },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('starts empty while nothing has arrived, and is loading while either query is', () => {
    mockData(undefined, undefined, { loading: true });
    const { result } = renderBalances();
    expect(result.current.rows).toEqual([]);
    expect(result.current.addable).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.nameOf('CL')).toBe('CL');
  });

  it('names held types and offers only the types not yet held', () => {
    const error = new Error('partial');
    mockData([held], [makePolicy('CL', 'Casual leave'), makePolicy('SL', 'Sick leave')], { error });
    const { result } = renderBalances();

    expect(result.current.rows).toEqual([held]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.nameOf('CL')).toBe('Casual leave');
    expect(result.current.nameOf('ML')).toBe('ML');
    expect(result.current.addable).toEqual([{ value: 'SL', label: 'Sick leave (SL)' }]);
  });

  it('removes a balance once confirmed, reloads and reports', async () => {
    const query = mockData([held], []);
    await confirmRemoval();

    expect(await screen.findByText('Leave balance removed')).toBeInTheDocument();
    expect(deleteBalance).toHaveBeenCalledWith({ variables: { id: 'bal-1' } });
    expect(query.refetch).toHaveBeenCalledTimes(1);
  });

  it('asks before removing, naming the type and year, and keeps it on Cancel', async () => {
    mockData([held], []);
    const { result } = renderBalances();
    act(() => {
      result.current.remove(held).catch(() => undefined);
    });
    expect(
      await screen.findByText(
        'Remove the CL balance for 2026? Days already taken stay on their requests.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deleteBalance).not.toHaveBeenCalled();
  });

  it("reports the server's reason when removal fails", async () => {
    mockData([held], []);
    deleteBalance.mockRejectedValueOnce(new Error('Balance has requests'));
    await confirmRemoval();
    expect(await screen.findByText('Balance has requests')).toBeInTheDocument();
  });

  it('uses a generic message for a non-Error failure', async () => {
    mockData([held], []);
    deleteBalance.mockRejectedValueOnce('offline');
    await confirmRemoval();
    expect(await screen.findByText('Could not remove the leave balance')).toBeInTheDocument();
  });
});
