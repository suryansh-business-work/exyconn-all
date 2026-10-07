import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BugSeverity, BugStatus } from '@exyconn/shell/graphql/generated';
import { BugForm, type BugRow } from '../../../../../../src/pages/bugs/forms/bug';
import { renderWithProviders } from '../../../../test-utils';
import { bugRow } from '../../../../fixtures';
import {
  fill,
  localIso,
  optionsOf,
  pickDate,
  pickOption,
  press,
} from '../../../../helpers/form-helpers';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  projects: vi.fn(),
  employees: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateBugMutation: () => [gql.create],
  useUpdateBugMutation: () => [gql.update],
  useListProjectsQuery: () => gql.projects(),
  useListEmployeeOptionsQuery: () => gql.employees(),
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: BugRow | null = null) =>
  renderWithProviders(<BugForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('BugForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: {} });
    gql.update.mockResolvedValue({ data: {} });
    gql.projects.mockReturnValue({
      data: { listProjects: [{ id: 'proj-1', key: 'WEB', name: 'Website' }] },
    });
    gql.employees.mockReturnValue({
      data: { listEmployeeOptions: [{ id: 'emp-1', name: 'Priya', email: 'priya@acme.io' }] },
    });
  });

  it('asks for a title, a description, an assignee and a due date', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Assignee is required')).toBeInTheDocument();
    expect(screen.getByText('Due date is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('wants more than a word or two of description', async () => {
    renderForm();
    fill('Description', 'Bad');

    await press('Create');

    expect(await screen.findByText('Add a little more detail')).toBeInTheDocument();
  });

  it('offers the projects by key and name, and people by name and email', async () => {
    renderForm();

    expect(await optionsOf(/^Project/)).toEqual(['WEB · Website']);
    expect(await optionsOf(/^Assignee/)).toEqual(['Priya (priya@acme.io)']);
  });

  it('offers nothing to pick before the lists load', async () => {
    gql.projects.mockReturnValue({ data: undefined });
    gql.employees.mockReturnValue({ data: undefined });
    renderForm();

    await userEvent.click(screen.getByRole('combobox', { name: /^Project/ }));

    expect(await screen.findByText('No options')).toBeInTheDocument();
  });

  it('creates an open, medium bug on no project unless told otherwise', async () => {
    renderForm();
    fill('Title', '  Crash on save  ');
    fill('Description', 'The app closes when saving');
    await userEvent.type(screen.getByRole('combobox', { name: /^Assignee/ }), 'Pri');
    await userEvent.click(await screen.findByRole('option', { name: 'Priya (priya@acme.io)' }));
    pickDate('dueDate', '10/20/2026');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Crash on save',
          description: 'The app closes when saving',
          severity: BugSeverity.Medium,
          status: BugStatus.Open,
          projectId: null,
          assigneeId: 'emp-1',
          dueDate: localIso(2026, 9, 20),
        },
      },
    });
    expect(await screen.findByText('Bug created')).toBeInTheDocument();
  });

  it('updates an existing bug by id, keeping its project', async () => {
    renderForm(bugRow({ id: 'bug-3' }));

    expect(screen.getByLabelText('Title')).toHaveValue('Crash on save');
    await pickOption(/^Severity/, 'Critical');
    await pickOption(/^Status/, 'In Progress');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'bug-3',
        input: expect.objectContaining({
          projectId: 'proj-1',
          severity: BugSeverity.Critical,
          status: BugStatus.InProgress,
          dueDate: '2026-10-20T00:00:00.000Z',
        }),
      },
    });
    expect(await screen.findByText('Bug updated')).toBeInTheDocument();
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.update.mockRejectedValueOnce('conflict');
    renderForm(bugRow());

    await press('Update');

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
