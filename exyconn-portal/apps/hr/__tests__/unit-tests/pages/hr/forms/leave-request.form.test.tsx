import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import {
  LeaveStatus,
  useCreateLeaveRequestMutation,
  useListLeavePoliciesQuery,
  useListUsersQuery,
  useUpdateLeaveRequestMutation,
} from '@exyconn/shell/graphql/generated';
import {
  LeaveRequestForm,
  type LeaveRequestRow,
} from '../../../../../src/pages/hr/forms/leave-request';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple, queryResult } from '../../../harness/gql-doubles';
import { chooseOption, combobox, fillField, optionsOf, press } from '../../../harness/form-fields';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateLeaveRequestMutation: vi.fn(),
  useUpdateLeaveRequestMutation: vi.fn(),
  useListUsersQuery: vi.fn(),
  useListLeavePoliciesQuery: vi.fn(),
}));

const create = vi.fn();
const update = vi.fn();

/** Local midnight as the ISO string the date picker stores. */
const localIso = (year: number, month: number, day: number) =>
  new Date(year, month, day).toISOString();

const row: LeaveRequestRow = {
  id: 'leave-1',
  employeeId: 'u2',
  type: 'CASUAL',
  fromDate: localIso(2026, 3, 1),
  toDate: localIso(2026, 3, 2),
  reason: 'Family visit',
  status: LeaveStatus.Pending,
};

function setDate(name: string, typed: string) {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`No ${name} field`);
  fireEvent.change(input, { target: { value: typed } });
}

function renderForm(initial: LeaveRequestRow | null) {
  const onDone = vi.fn();
  renderWithProviders(<LeaveRequestForm initial={initial} onDone={onDone} onCancel={vi.fn()} />);
  return onDone;
}

beforeEach(() => {
  create.mockReset().mockResolvedValue({ data: {} });
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useCreateLeaveRequestMutation).mockReturnValue(mutationTuple(create) as never);
  vi.mocked(useUpdateLeaveRequestMutation).mockReturnValue(mutationTuple(update) as never);
  vi.mocked(useListUsersQuery).mockReturnValue(
    queryResult({
      listUsers: [
        { id: 'u1', name: 'Asha Rao', email: 'asha@example.com' },
        { id: 'u2', name: 'Bilal Khan', email: 'bilal@example.com' },
      ],
    }) as never,
  );
  vi.mocked(useListLeavePoliciesQuery).mockReturnValue(
    queryResult({
      listLeavePolicies: [
        { code: 'SICK', name: 'Sick leave' },
        { code: 'CASUAL', name: 'Casual leave' },
      ],
    }) as never,
  );
});

describe('LeaveRequestForm', () => {
  it('offers HR’s leave types and every status', async () => {
    renderForm(null);
    // Read before the select is opened: leaving it empty is an error that replaces the hint.
    expect(screen.getByText('Leave types are managed under Leave Settings.')).toBeInTheDocument();
    expect(await optionsOf('Type')).toEqual(['Sick leave (SICK)', 'Casual leave (CASUAL)']);
    expect(await optionsOf('Status')).toEqual(['Approved', 'Pending', 'Rejected']);
  });

  it('files a pending request for the chosen employee', async () => {
    const onDone = renderForm(null);
    await chooseOption('Employee', 'Asha Rao (asha@example.com)');
    await chooseOption('Type', 'Sick leave (SICK)');
    setDate('fromDate', '03/10/2026');
    setDate('toDate', '03/11/2026');
    await fillField('Reason', '  Flu symptoms ');
    await press('Create');

    expect(await screen.findByText('Leave request created')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: {
          employeeId: 'u1',
          type: 'SICK',
          fromDate: localIso(2026, 2, 10),
          toDate: localIso(2026, 2, 11),
          reason: 'Flu symptoms',
          status: LeaveStatus.Pending,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('names every missing field and refuses a reason under three characters', async () => {
    renderForm(null);
    await fillField('Reason', 'no');
    await press('Create');

    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(screen.getByText('Leave type is required')).toBeInTheDocument();
    expect(screen.getByText('From date is required')).toBeInTheDocument();
    expect(screen.getByText('To date is required')).toBeInTheDocument();
    expect(screen.getByText('Add a reason')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('opens on the request and saves a decision by id', async () => {
    const onDone = renderForm(row);
    expect(combobox('Employee')).toHaveValue('Bilal Khan (bilal@example.com)');
    await chooseOption('Status', 'Approved');
    await press('Update');

    expect(await screen.findByText('Leave request updated')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      variables: {
        id: 'leave-1',
        input: {
          employeeId: 'u2',
          type: 'CASUAL',
          fromDate: row.fromDate,
          toDate: row.toDate,
          reason: 'Family visit',
          status: LeaveStatus.Approved,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('offers no employees or types before the lists arrive', async () => {
    vi.mocked(useListUsersQuery).mockReturnValue(queryResult(undefined) as never);
    vi.mocked(useListLeavePoliciesQuery).mockReturnValue(queryResult(undefined) as never);
    renderForm(null);
    expect(combobox('Employee')).toHaveValue('');
    expect(await optionsOf('Type')).toEqual([]);
  });
});
