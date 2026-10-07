import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ProjectStatus } from '@exyconn/shell/graphql/generated';
import { ProjectForm, type ProjectRow } from '../../../../../../src/pages/projects/forms/project';
import { renderWithProviders } from '../../../../test-utils';
import { projectRow } from '../../../../fixtures';
import { pickOption, press } from '../../../../helpers/form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), clients: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateProjectMutation: () => [gql.create],
  useUpdateProjectMutation: () => [gql.update],
  useListClientsQuery: () => gql.clients(),
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: ProjectRow | null = null) =>
  renderWithProviders(<ProjectForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('ProjectForm editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: {} });
    gql.update.mockResolvedValue({ data: {} });
    gql.clients.mockReturnValue({
      data: { listClients: [{ id: 'client-1', name: 'Meera', company: 'Northwind' }] },
    });
  });

  it('updates an existing project by id with its new status', async () => {
    renderForm(projectRow({ id: 'proj-3' }));
    expect(screen.getByLabelText('Project name')).toHaveValue('Website');

    await pickOption(/^Status/, 'On Hold');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'proj-3',
        input: {
          name: 'Website',
          description: 'Marketing site',
          status: ProjectStatus.OnHold,
          clientId: 'client-1',
          budgetAmount: 50000,
          budgetHours: 400,
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-12-01T00:00:00.000Z',
        },
      },
    });
    expect(await screen.findByText('Project updated')).toBeInTheDocument();
  });

  it('sends the blanks of a project with gaps back as nothing, not zero', async () => {
    renderForm(
      projectRow({
        description: null,
        clientId: null,
        budgetAmount: null,
        budgetHours: null,
        startDate: null,
        endDate: null,
      }),
    );

    await press('Update');

    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input).toEqual(
      expect.objectContaining({
        description: '',
        clientId: null,
        budgetAmount: null,
        budgetHours: null,
        startDate: null,
        endDate: null,
      }),
    );
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.update.mockRejectedValueOnce('conflict');
    renderForm(projectRow());

    await press('Update');

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
