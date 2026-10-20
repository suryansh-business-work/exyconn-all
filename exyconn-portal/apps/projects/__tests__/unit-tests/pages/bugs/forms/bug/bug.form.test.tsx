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

vi.mock('@exyconn/shell/components/form/rhf/RhfRichText', async () => ({
  RhfRichText: (await import('../../../../helpers/rich-text.stub')).RhfRichTextStub,
}));

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

  it('asks only for a title, a project and a description', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Project is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.queryByText(/Assignee is required|Due date is required/)).not.toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('wants more than a word or two of description, and reads past empty tags', async () => {
    renderForm();
    fill('Description', '<p>Bad</p>');

    await press('Create');

    expect(
      await screen.findByText('Add a little more detail (at least 10 characters)'),
    ).toBeInTheDocument();

    fill('Description', '<p> </p>');
    expect(await screen.findByText('Description is required')).toBeInTheDocument();
  });

  it('takes only full https links', async () => {
    renderForm();
    fill('Public link', 'example.com');
    fill('Private link', 'https://staging.example.com/login');

    await press('Create');

    expect(await screen.findAllByText('Enter a full link starting with https://')).toHaveLength(1);
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

  it('creates an open, medium bug, unassigned and undated unless told otherwise', async () => {
    renderForm();
    fill(/^Title/, '  Crash on save  ');
    fill('Description', '<p>The app closes when saving</p>');
    fill('Steps to reproduce', '<p></p>');
    await pickOption(/^Project/, 'WEB · Website');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Crash on save',
          description: '<p>The app closes when saving</p>',
          stepsToReproduce: '',
          publicLink: '',
          privateLink: '',
          attachments: [],
          severity: BugSeverity.Medium,
          status: BugStatus.Open,
          projectId: 'proj-1',
          assigneeId: null,
          dueDate: null,
        },
      },
    });
    expect(await screen.findByText('Bug created')).toBeInTheDocument();
  });

  it('saves who fixes it, by when, the steps and the links when they are given', async () => {
    renderForm();
    fill(/^Title/, 'Crash on save');
    fill('Description', '<p>The app closes when saving</p>');
    fill('Steps to reproduce', '<ol><li>Open a doc</li><li>Save</li></ol>');
    fill('Public link', 'https://app.example.com/docs');
    await pickOption(/^Project/, 'WEB · Website');
    await userEvent.type(screen.getByRole('combobox', { name: /^Assignee/ }), 'Pri');
    await userEvent.click(await screen.findByRole('option', { name: 'Priya (priya@acme.io)' }));
    pickDate('dueDate', '10/20/2026');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          stepsToReproduce: '<ol><li>Open a doc</li><li>Save</li></ol>',
          publicLink: 'https://app.example.com/docs',
          assigneeId: 'emp-1',
          dueDate: localIso(2026, 9, 20),
        }),
      },
    });
  });

  it('updates an existing bug by id, keeping its project and files', async () => {
    const file = {
      __typename: 'FileAttachment' as const,
      url: 'https://cdn/a.png',
      name: 'a.png',
      contentType: 'image/png',
    };
    renderForm(
      bugRow({
        id: 'bug-3',
        description: '<p>The app closes when saving</p>',
        attachments: [file],
      }),
    );

    expect(screen.getByRole('textbox', { name: /^Title/ })).toHaveValue('Crash on save');
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
          attachments: [{ url: 'https://cdn/a.png', name: 'a.png', contentType: 'image/png' }],
          dueDate: '2026-10-20T00:00:00.000Z',
        }),
      },
    });
    expect(await screen.findByText('Bug updated')).toBeInTheDocument();
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.update.mockRejectedValueOnce('conflict');
    renderForm(bugRow({ description: '<p>The app closes when saving</p>' }));

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
