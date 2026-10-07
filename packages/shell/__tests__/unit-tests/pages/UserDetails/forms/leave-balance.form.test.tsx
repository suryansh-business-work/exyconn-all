import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCreateLeaveBalanceMutation, useUpdateLeaveBalanceMutation } from '@/graphql/generated';
import { LeaveBalanceForm, type LeaveBalanceRow } from '@/pages/UserDetails/forms/leave-balance';
import type { SelectOption } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple } from '../../hookMocks';
import { makeBalance } from '../leaveFixtures';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useCreateLeaveBalanceMutation: vi.fn(),
  useUpdateLeaveBalanceMutation: vi.fn(),
}));

const create = vi.fn();
const update = vi.fn();
const OPTIONS: SelectOption[] = [{ value: 'SL', label: 'Sick leave (SL)' }];

function renderForm(initial: LeaveBalanceRow | null, typeOptions = OPTIONS) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <LeaveBalanceForm
      employeeId="emp-1"
      year={2026}
      initial={initial}
      typeOptions={typeOptions}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );
  return { onDone, onCancel };
}

const days = (label: string) => screen.getByRole('spinbutton', { name: label });

async function setDays(label: string, value: string) {
  await userEvent.clear(days(label));
  await userEvent.type(days(label), value);
}

beforeEach(() => {
  create.mockReset().mockResolvedValue({ data: {} });
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useCreateLeaveBalanceMutation).mockReturnValue(mutationTuple(create) as never);
  vi.mocked(useUpdateLeaveBalanceMutation).mockReturnValue(mutationTuple(update) as never);
});

describe('LeaveBalanceForm — adding a leave type', () => {
  it('needs a leave type before it saves', async () => {
    renderForm(null);
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Choose a leave type')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('adds the chosen type for this employee and year', async () => {
    const { onDone } = renderForm(null);

    await userEvent.click(screen.getByRole('combobox', { name: 'Leave type' }));
    await userEvent.click(within(screen.getByRole('listbox')).getByText('Sick leave (SL)'));
    await setDays('Allocated', '10');
    expect(screen.getByRole('status')).toHaveTextContent('Available after saving: 10 days');

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Leave balance created')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: {
          leaveTypeCode: 'SL',
          allocated: 10,
          carriedForward: 0,
          adjustment: 0,
          used: 0,
          employeeId: 'emp-1',
          year: 2026,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('explains an empty list of types', () => {
    renderForm(null, []);
    expect(screen.getByText('They already hold every leave type HR offers.')).toBeInTheDocument();
  });

  it('counts text it cannot read as a number as zero while it is typed', () => {
    renderForm(makeBalance());
    // jsdom sanitises a number input's value, so stand in for a field that hands over its
    // raw, half-typed text.
    const input = days('Carried forward');
    Object.defineProperty(input, 'value', { configurable: true, get: () => '2-' });
    fireEvent.change(input);
    expect(screen.getByRole('status')).toHaveTextContent('Available after saving: 9 days');
  });
});

describe('LeaveBalanceForm — adjusting a held balance', () => {
  it('names the type and year instead of offering a picker', () => {
    renderForm(makeBalance());
    expect(screen.getByText('CL for 2026')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Leave type' })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Available after saving: 11 days');
  });

  it('refuses an adjustment that leaves the balance below zero', async () => {
    renderForm(makeBalance());
    await setDays('Adjustment', '-12');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('This would leave fewer than 0 days available'),
    ).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it('saves the adjusted days against the balance', async () => {
    const { onDone } = renderForm(makeBalance());
    await setDays('Adjustment', '-2');
    expect(screen.getByRole('status')).toHaveTextContent('Available after saving: 9 days');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Leave balance updated')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      variables: {
        id: 'bal-1',
        input: {
          leaveTypeCode: 'CL',
          allocated: 12,
          carriedForward: 2,
          adjustment: -2,
          used: 3,
          employeeId: 'emp-1',
          year: 2026,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('reports a save the server refuses and stays open', async () => {
    update.mockRejectedValueOnce(new Error('Balance is locked'));
    const { onDone } = renderForm(makeBalance());
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Balance is locked')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels on request', async () => {
    const { onCancel } = renderForm(makeBalance());
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
