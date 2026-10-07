import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectStatus } from '@exyconn/shell/graphql/generated';
import { ProjectForm, type ProjectRow } from '../../../../../../src/pages/projects/forms/project';
import { renderWithProviders } from '../../../../test-utils';
import { fill, localIso, optionsOf, pickDate, press } from '../../../../helpers/form-helpers';

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

describe('ProjectForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: {} });
    gql.update.mockResolvedValue({ data: {} });
    gql.clients.mockReturnValue({
      data: { listClients: [{ id: 'client-1', name: 'Meera', company: 'Northwind' }] },
    });
  });

  it('asks for a name before anything else', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a negative budget and a long description', async () => {
    renderForm();
    fill('Project name', 'Intranet');
    fill('Budget hours (optional)', '-5');
    fill('Description (optional)', 'd'.repeat(501));

    await press('Create');

    expect(await screen.findByText('Must be ≥ 0')).toBeInTheDocument();
    expect(screen.getByText('Keep the description under 500 characters')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a project that ends before it starts', async () => {
    renderForm();
    fill('Project name', 'Intranet');
    pickDate('startDate', '10/10/2026');
    pickDate('endDate', '10/09/2026');

    await press('Create');

    expect(
      await screen.findByText('End date must be on or after the start date'),
    ).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('offers clients by name and company', async () => {
    renderForm();

    expect(await optionsOf(/^Client/)).toEqual(['Meera · Northwind']);
  });

  it('offers no clients before the list loads', async () => {
    gql.clients.mockReturnValue({ data: undefined });
    renderForm();

    await userEvent.click(screen.getByRole('combobox', { name: /^Client/ }));

    expect(await screen.findByText('No options')).toBeInTheDocument();
  });

  it('plans an internal project with no budget or dates unless they are given', async () => {
    renderForm();
    fill('Project name', '  Intranet  ');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Intranet',
          description: '',
          status: ProjectStatus.Planning,
          clientId: null,
          budgetAmount: null,
          budgetHours: null,
          startDate: null,
          endDate: null,
        },
      },
    });
    expect(await screen.findByText('Project created')).toBeInTheDocument();
  });

  it('saves the client, budgets and a same-day start and end', async () => {
    renderForm();
    fill('Project name', 'Website');
    await userEvent.type(screen.getByRole('combobox', { name: /^Client/ }), 'Mee');
    await userEvent.click(await screen.findByRole('option', { name: 'Meera · Northwind' }));
    fill('Budget amount (optional)', '12000.5');
    fill('Budget hours (optional)', '0');
    pickDate('startDate', '10/10/2026');
    pickDate('endDate', '10/10/2026');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input).toEqual(
      expect.objectContaining({
        clientId: 'client-1',
        budgetAmount: 12000.5,
        budgetHours: 0,
        startDate: localIso(2026, 9, 10),
        endDate: localIso(2026, 9, 10),
      }),
    );
  });

  it('cancels without saving', async () => {
    renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
