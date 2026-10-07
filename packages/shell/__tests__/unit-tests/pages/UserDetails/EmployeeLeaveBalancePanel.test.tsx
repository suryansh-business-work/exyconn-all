import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeLeaveBalancePanel } from '@/pages/UserDetails/EmployeeLeaveBalancePanel';
import { useEmployeeLeaveBalances } from '@/pages/UserDetails/useEmployeeLeaveBalances';
import type { LeaveBalanceRow } from '@/pages/UserDetails/forms/leave-balance';
import type { SelectOption } from '@/components/form/rhf';
import { portalLogger } from '@/logging/portalLogger';
import { renderWithProviders } from '../../test-utils';
import { makeBalance } from './leaveFixtures';

vi.mock('@/logging/portalLogger', () => ({ portalLogger: { warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/pages/UserDetails/useEmployeeLeaveBalances', () => ({
  useEmployeeLeaveBalances: vi.fn(),
}));

interface FormStubProps {
  initial: LeaveBalanceRow | null;
  typeOptions: SelectOption[];
  year: number;
  onDone: () => void;
  onCancel: () => void;
}

// The form has its own tests; the stub shows what the panel handed it.
vi.mock('@/pages/UserDetails/forms/leave-balance', () => ({
  LeaveBalanceForm: ({ initial, typeOptions, year, onDone, onCancel }: Readonly<FormStubProps>) => (
    <div>
      <p>{`editing ${initial?.leaveTypeCode ?? 'new'} in ${year}`}</p>
      <p>{`offered ${typeOptions.map((option) => option.value).join(',')}`}</p>
      <button type="button" onClick={onDone}>
        form done
      </button>
      <button type="button" onClick={onCancel}>
        form cancel
      </button>
    </div>
  ),
}));

const rows = [
  makeBalance({ id: 'b-cl', leaveTypeCode: 'CL', adjustment: 2, available: 13 }),
  makeBalance({ id: 'b-sl', leaveTypeCode: 'SL', adjustment: -1, available: 10 }),
  makeBalance({ id: 'b-ml', leaveTypeCode: 'ML', adjustment: 0, available: 11 }),
];

function mockBalances(patch = {}) {
  const balances = {
    rows,
    loading: false,
    error: undefined as Error | undefined,
    refetch: vi.fn().mockResolvedValue({}),
    nameOf: (code: string) => (code === 'CL' ? 'Casual leave' : code),
    addable: [{ value: 'PL', label: 'Paid leave (PL)' }],
    remove: vi.fn().mockResolvedValue(undefined),
    ...patch,
  };
  vi.mocked(useEmployeeLeaveBalances).mockReturnValue(balances);
  return balances;
}

const click = async (name: string) => userEvent.click(await screen.findByRole('button', { name }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 4, 1));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EmployeeLeaveBalancePanel', () => {
  it("shows this year's balances with names and signed adjustments", () => {
    mockBalances();
    renderWithProviders(<EmployeeLeaveBalancePanel employeeId="emp-1" />);

    expect(useEmployeeLeaveBalances).toHaveBeenCalledWith('emp-1', 2026);
    expect(screen.getByRole('heading', { name: 'Leave balance 2026' })).toBeInTheDocument();
    const [, casual, sick, maternity] = screen.getAllByRole('row');
    expect(within(casual).getByText('Casual leave')).toBeInTheDocument();
    expect(within(casual).getByText('+2')).toBeInTheDocument();
    expect(within(sick).getByText('-1')).toBeInTheDocument();
    expect(within(maternity).getByText('0')).toBeInTheDocument();
  });

  it('locks Add while loading and shows a load error', () => {
    mockBalances({ loading: true, error: new Error('Balances unavailable') });
    renderWithProviders(<EmployeeLeaveBalancePanel employeeId="emp-1" />);
    expect(screen.getByRole('button', { name: 'Add leave type' })).toBeDisabled();
    expect(screen.getByText('Balances unavailable')).toBeInTheDocument();
  });

  it('adds a type the employee does not hold, then closes and reloads', async () => {
    const balances = mockBalances();
    renderWithProviders(<EmployeeLeaveBalancePanel employeeId="emp-1" />);

    await click('Add leave type');
    expect(screen.getByRole('heading', { name: 'Add leave type' })).toBeInTheDocument();
    expect(screen.getByText('editing new in 2026')).toBeInTheDocument();
    expect(screen.getByText('offered PL')).toBeInTheDocument();

    await click('form done');
    expect(balances.refetch).toHaveBeenCalled();
    await expect.poll(() => screen.queryByText('editing new in 2026')).toBeNull();
  });

  it('logs a reload that fails after saving', async () => {
    const failure = new Error('reload failed');
    mockBalances({ refetch: vi.fn().mockRejectedValue(failure) });
    renderWithProviders(<EmployeeLeaveBalancePanel employeeId="emp-1" />);

    await click('Add leave type');
    await click('form done');
    await expect
      .poll(() => vi.mocked(portalLogger.warn).mock.calls.at(-1))
      .toEqual(['Could not reload leave balances', failure]);
  });

  it('adjusts a held balance and closes on cancel', async () => {
    mockBalances();
    renderWithProviders(<EmployeeLeaveBalancePanel employeeId="emp-1" />);

    const [adjustCasual] = screen.getAllByRole('button', { name: 'adjust leave balance' });
    await userEvent.click(adjustCasual);
    expect(screen.getByRole('heading', { name: 'Adjust leave balance' })).toBeInTheDocument();
    expect(screen.getByText('editing CL in 2026')).toBeInTheDocument();

    await click('form cancel');
    await expect.poll(() => screen.queryByText('editing CL in 2026')).toBeNull();
  });

  it('removes a balance through the hook, logging a removal that throws', async () => {
    const failure = new Error('remove crashed');
    const balances = mockBalances({ remove: vi.fn().mockRejectedValue(failure) });
    renderWithProviders(<EmployeeLeaveBalancePanel employeeId="emp-1" />);

    const removeButtons = screen.getAllByRole('button', { name: 'remove leave balance' });
    await userEvent.click(removeButtons[1]);

    expect(balances.remove).toHaveBeenCalledWith(rows[1]);
    await expect
      .poll(() => vi.mocked(portalLogger.error).mock.calls.at(-1))
      .toEqual(['Removing a leave balance failed', failure]);
  });
});
