import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestStatus, RequestType } from '@exyconn/shell/graphql/generated';
import {
  EmployeeRequestForm,
  type EmployeeRequestRow,
} from '../../../../../../src/pages/requests/forms/employee-request';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), users: undefined as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateEmployeeRequestMutation: () => [gql.create],
  useUpdateEmployeeRequestMutation: () => [gql.update],
  useListUsersQuery: () => ({ data: gql.users }),
}));

const USERS = { listUsers: [{ id: 'user-1', name: 'Asha Rao', email: 'asha@example.com' }] };

const ROW: EmployeeRequestRow = {
  id: 'request-5',
  employeeId: 'user-1',
  type: RequestType.Wfh,
  subject: 'Work from home on Friday',
  details: 'Plumber visiting',
  status: RequestStatus.Pending,
  decisionNote: 'Fine by me',
  decidedAt: null,
  createdAt: '2026-03-04T12:00:00.000Z',
};

function renderForm(initial: EmployeeRequestRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <EmployeeRequestForm initial={initial} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

async function choose(field: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: field }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}

describe('EmployeeRequestForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: { createEmployeeRequest: { id: 'r9' } } });
    gql.update.mockReset().mockResolvedValue({ data: { updateEmployeeRequest: { id: 'r5' } } });
    gql.users = USERS;
  });

  it('raises a new request with an empty decision note sent as not set', async () => {
    const user = userEvent.setup();
    const { onDone } = renderForm();

    await user.type(screen.getByRole('combobox', { name: 'Employee' }), 'Asha');
    await user.click(await screen.findByRole('option', { name: 'Asha Rao (asha@example.com)' }));
    await choose(/^Type/, 'Travel');
    await user.type(screen.getByLabelText('Subject'), ' Client visit ');
    await user.type(screen.getByLabelText('Details'), 'Two days in Pune');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          employeeId: 'user-1',
          type: RequestType.Travel,
          subject: 'Client visit',
          details: 'Two days in Pune',
          status: RequestStatus.Approved,
          decisionNote: null,
        },
      },
    });
    expect(await screen.findByText('EmployeeRequest created')).toBeInTheDocument();
  });

  it('starts a new request on the first type and status', () => {
    renderForm();

    expect(screen.getByRole('combobox', { name: /^Type/ })).toHaveTextContent('Document');
    expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveTextContent('Approved');
  });

  it('opens an existing request and records the decision on it', async () => {
    const { onDone } = renderForm(ROW);

    expect(screen.getByLabelText('Decision note')).toHaveValue('Fine by me');
    await choose(/^Status/, 'Rejected');
    await userEvent.clear(screen.getByLabelText('Decision note'));
    await userEvent.type(screen.getByLabelText('Decision note'), ' Team offsite that day ');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'request-5',
        input: {
          employeeId: 'user-1',
          type: RequestType.Wfh,
          subject: 'Work from home on Friday',
          details: 'Plumber visiting',
          status: RequestStatus.Rejected,
          decisionNote: 'Team offsite that day',
        },
      },
    });
    expect(await screen.findByText('EmployeeRequest updated')).toBeInTheDocument();
  });

  it('opens a request with no decision note as an empty field', () => {
    renderForm({ ...ROW, decisionNote: null });

    expect(screen.getByLabelText('Decision note')).toHaveValue('');
  });

  it('says which required fields are missing, treating spaces as empty', async () => {
    gql.users = undefined;
    renderForm();

    await userEvent.type(screen.getByLabelText('Subject'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(screen.getByText('Subject is required')).toBeInTheDocument();
    expect(screen.getByText('Details is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it("reports the server's reason and does not close", async () => {
    gql.update.mockRejectedValue(new Error('Request already decided'));
    const { onDone } = renderForm(ROW);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Request already decided')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
