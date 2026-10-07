import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useActiveLeavePoliciesQuery,
  useApplyLeaveMutation,
  useMyLeaveBalancesQuery,
  type ActiveLeavePoliciesQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { localIso, mutationTuple, pickerInput, queryResult } from '../../apolloHookMocks';
import { ApplyLeaveForm } from '../../../../../../src/pages/employee/forms/apply-leave';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useActiveLeavePoliciesQuery: vi.fn(),
  useApplyLeaveMutation: vi.fn(),
  useMyLeaveBalancesQuery: vi.fn(),
}));

type Policy = ActiveLeavePoliciesQuery['activeLeavePolicies'][number];

const policy = (code: string, name: string): Policy => ({
  id: `p-${code}`,
  code,
  name,
  annualQuota: 12,
  paid: true,
  halfDayAllowed: true,
  carryForwardCap: 0,
  active: true,
  overrides: [],
});

const YEAR = new Date().getFullYear();
const balance = (id: string, leaveTypeCode: string, available: number) => ({
  id,
  employeeId: 'emp-1',
  leaveTypeCode,
  year: YEAR,
  allocated: available,
  carriedForward: 0,
  used: 0,
  adjustment: 0,
  available,
});

const apply = vi.fn();

function setup(policies: Parameters<typeof queryResult>[0] = {}) {
  vi.mocked(useActiveLeavePoliciesQuery).mockReturnValue(
    queryResult<typeof useActiveLeavePoliciesQuery>(policies),
  );
  const onCancel = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(<ApplyLeaveForm onCancel={onCancel} onDone={onDone} />);
  return { onCancel, onDone };
}

const OFFERED = { data: { activeLeavePolicies: [policy('CL', 'Casual Leave')] } };

async function fillValid() {
  await userEvent.click(screen.getByRole('combobox', { name: /Leave type/ }));
  await userEvent.click(
    within(screen.getByRole('listbox')).getByRole('option', { name: 'Casual Leave (CL)' }),
  );
  fireEvent.change(pickerInput('fromDate'), { target: { value: '03/04/2026' } });
  fireEvent.change(pickerInput('toDate'), { target: { value: '03/06/2026' } });
  await userEvent.type(screen.getByLabelText('Reason'), '  Family function ');
}

beforeEach(() => {
  apply.mockReset();
  vi.mocked(useApplyLeaveMutation).mockReturnValue(
    mutationTuple<typeof useApplyLeaveMutation>(apply),
  );
  vi.mocked(useMyLeaveBalancesQuery).mockReturnValue(
    queryResult<typeof useMyLeaveBalancesQuery>({
      data: { myLeaveBalances: [balance('b-cl', 'CL', 10), balance('b-xx', 'XX', 4)] },
    }),
  );
});

describe('ApplyLeaveForm', () => {
  it('says the leave types are loading', () => {
    setup({ loading: true });
    expect(screen.getByText('Loading your leave types…')).toBeInTheDocument();
  });

  it('says HR has offered no leave types once the policies are in', () => {
    setup({ data: { activeLeavePolicies: [] } });
    expect(
      screen.getByText('HR has not set up any leave types for your country yet.'),
    ).toBeInTheDocument();
  });

  it('names balances by HR’s policy name, falling back to the code', () => {
    setup(OFFERED);
    expect(screen.getByText('Casual Leave')).toBeInTheDocument();
    expect(screen.getByText('XX')).toBeInTheDocument();
  });

  it('requires every field and a reason of a few characters', async () => {
    setup(OFFERED);
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Choose a leave type')).toBeInTheDocument();
    expect(screen.getByText('From date is required')).toBeInTheDocument();
    expect(screen.getByText('To date is required')).toBeInTheDocument();
    expect(screen.getByText('Reason is required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Reason'), 'ab');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Add a brief reason')).toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
  });

  it('counts the calendar days once both dates are set and guides the to date', () => {
    setup(OFFERED);
    expect(screen.getByText('Pick the from date first.')).toBeInTheDocument();

    fireEvent.change(pickerInput('fromDate'), { target: { value: '03/04/2026' } });
    expect(
      screen.getByText('The last day you are away — on or after the from date.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/calendar days, both dates included/)).toBeNull();

    fireEvent.change(pickerInput('toDate'), { target: { value: '03/06/2026' } });
    expect(screen.getByRole('status')).toHaveTextContent('3 calendar days, both dates included.');
  });

  it('clears the to date when the from date moves past it', async () => {
    setup(OFFERED);
    fireEvent.change(pickerInput('fromDate'), { target: { value: '03/04/2026' } });
    fireEvent.change(pickerInput('toDate'), { target: { value: '03/06/2026' } });
    expect(screen.getByText('3 calendar days, both dates included.')).toBeInTheDocument();

    fireEvent.change(pickerInput('fromDate'), { target: { value: '03/10/2026' } });

    await waitFor(() =>
      expect(screen.queryByText(/calendar days, both dates included/)).toBeNull(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('To date is required')).toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
  });

  it('applies with the trimmed values, confirms, resets and reports done', async () => {
    apply.mockResolvedValue({ data: { applyLeave: { id: 'leave-1' } } });
    const { onDone } = setup(OFFERED);
    await fillValid();
    expect(screen.getByText('This request uses 3 days; 7 will be left.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(apply).toHaveBeenCalledWith({
      variables: {
        input: {
          type: 'CL',
          fromDate: localIso(2026, 2, 4),
          toDate: localIso(2026, 2, 6),
          reason: 'Family function',
        },
      },
    });
    expect(await screen.findByText('Leave applied — pending approval')).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toHaveValue('');
  });

  it('shows the server’s message when the application fails', async () => {
    apply.mockRejectedValue(new Error('Leave overlaps an approved request'));
    const { onDone } = setup(OFFERED);
    await fillValid();

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Leave overlaps an approved request')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    apply.mockRejectedValue('offline');
    setup(OFFERED);
    await fillValid();

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Could not apply for leave')).toBeInTheDocument();
  });

  it('cancels without applying', async () => {
    const { onCancel } = setup(OFFERED);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(apply).not.toHaveBeenCalled();
  });
});
