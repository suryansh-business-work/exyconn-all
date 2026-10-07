import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItAccessKind } from '@exyconn/shell/graphql/generated';
import {
  AccessRequestForm,
  type AccessRequestRow,
} from '../../../../../../src/pages/access/forms/access-request';
import { ASSIGNEE, ASSIGNEE_LABEL, accessRow } from '../../../../core/rows.fixtures';
import { choose, fill, pickOption, press, toast } from '../../../../core/form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  settings: vi.fn(),
  assignees: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateItAccessRequestMutation: () => [gql.create],
  useUpdateItAccessRequestMutation: () => [gql.update],
  useListAssetAssigneesQuery: gql.assignees,
  useItSettingsQuery: gql.settings,
}));

const onDone = vi.fn();
const onCancel = vi.fn();

function renderForm(
  initial: AccessRequestRow | null = null,
  kind = ItAccessKind.Grant,
  lockKind?: boolean,
) {
  return renderWithProviders(
    <AccessRequestForm
      initial={initial}
      kind={kind}
      lockKind={lockKind}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );
}

describe('AccessRequestForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.settings.mockReset().mockReturnValue({ data: { itSettings: { applications: ['Slack'] } } });
    gql.assignees.mockReset().mockReturnValue({ data: { listAssetAssignees: [ASSIGNEE] } });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('asks who, for what and why', async () => {
    renderForm();
    await press('Create');
    expect(await screen.findByText('Pick the employee')).toBeInTheDocument();
    expect(screen.getByText('Pick the application')).toBeInTheDocument();
    expect(screen.getByText('Say why it is needed')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('raises a grant for a person and an application IT manages', async () => {
    renderForm();
    await choose('Employee', 'Ana', ASSIGNEE_LABEL);
    await choose('Application', 'Sla', 'Slack');
    fill('Role or level', 'Editor');
    fill('Reason', 'Joins the support team');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          employeeId: 'emp-1',
          application: 'Slack',
          kind: ItAccessKind.Grant,
          accessLevel: 'Editor',
          reason: 'Joins the support team',
          expiresAt: null,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Request created');
  });

  it('asks for a level and an expiry only when access is being granted', async () => {
    renderForm();
    expect(screen.getByLabelText('Role or level')).toBeInTheDocument();
    expect(
      screen.getByText('Temporary until (optional)', { selector: 'label' }),
    ).toBeInTheDocument();

    await pickOption(/^Request/, 'Revoke');
    expect(screen.queryByLabelText('Role or level')).not.toBeInTheDocument();
    expect(screen.queryByText('Temporary until (optional)')).not.toBeInTheDocument();
  });

  it('hides the kind picker on a screen that raises only one kind', () => {
    renderForm(null, ItAccessKind.PasswordReset, true);
    expect(screen.queryByRole('combobox', { name: /^Request/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Role or level')).not.toBeInTheDocument();
  });

  it('points to IT Admin Settings while no applications are listed', async () => {
    gql.settings.mockReturnValue({ data: undefined });
    gql.assignees.mockReturnValue({ data: undefined });
    renderForm();
    expect(screen.getByText('Add applications in IT Admin Settings first')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Employee' }));
    expect(await screen.findByText('No options')).toBeInTheDocument();
  });

  it('saves changes onto the request being edited', async () => {
    const row = accessRow({
      kind: ItAccessKind.RoleChange,
      accessLevel: 'Admin',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    renderForm(row);
    expect(screen.getByLabelText('Role or level')).toHaveValue('Admin');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'acc-1',
        input: expect.objectContaining({
          kind: ItAccessKind.RoleChange,
          accessLevel: 'Admin',
          expiresAt: '2099-01-01T00:00:00.000Z',
        }),
      },
    });
    expect(await toast()).toHaveTextContent('Request updated');
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('The request is no longer pending'));
    renderForm(accessRow());
    await press('Update');

    expect(await toast()).toHaveTextContent('The request is no longer pending');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
