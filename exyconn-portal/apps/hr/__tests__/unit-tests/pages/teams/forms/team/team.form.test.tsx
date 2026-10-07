import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamForm, type TeamRow } from '../../../../../../src/pages/teams/forms/team';
import { renderWithProviders } from '../../../../test-utils';
import { USERS, pickOption, press, typeInto } from '../../../../harness/forms';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  users: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateTeamMutation: () => [gql.create],
  useUpdateTeamMutation: () => [gql.update],
  useListUsersQuery: () => gql.users(),
}));

const ROW: TeamRow = {
  id: 'team-3',
  name: 'Platform',
  department: 'Engineering',
  leadEmployeeId: 'user-2',
  description: 'Runs the shared services',
  active: true,
};

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: TeamRow | null = null) =>
  renderWithProviders(<TeamForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('TeamForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.users.mockReset().mockReturnValue({ data: { listUsers: USERS } });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('creates a team led by the picked employee, with trimmed text', async () => {
    renderForm();
    await typeInto('Name', ' Payments ');
    await typeInto('Department', ' Finance ');
    await pickOption('Team lead', 'Asha Rao (asha@example.com)');
    await typeInto('Description', 'Owns the ledger');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Payments',
          department: 'Finance',
          leadEmployeeId: 'user-1',
          description: 'Owns the ledger',
          active: false,
        },
      },
    });
    expect(await screen.findByText('Team created')).toBeInTheDocument();
  });

  it('opens an existing team with its lead named and updates it by id', async () => {
    renderForm(ROW);
    expect(screen.getByRole('combobox', { name: 'Team lead' })).toHaveValue(
      'Bo Chen (bo@example.com)',
    );
    await userEvent.click(screen.getByLabelText('Active'));
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'team-3',
        input: {
          name: 'Platform',
          department: 'Engineering',
          leadEmployeeId: 'user-2',
          description: 'Runs the shared services',
          active: false,
        },
      },
    });
    expect(await screen.findByText('Team updated')).toBeInTheDocument();
  });

  it('asks for a name and a team lead before anything is sent', async () => {
    renderForm();
    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Employee is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('offers no one to lead the team while the people list has not loaded', async () => {
    gql.users.mockReturnValue({ data: undefined });
    renderForm({ ...ROW, leadEmployeeId: null });

    expect(screen.getByRole('combobox', { name: 'Team lead' })).toHaveValue('');
    await press('Update');
    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('Team name already used'));
    renderForm(ROW);
    await press('Update');

    expect(await screen.findByText('Team name already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
