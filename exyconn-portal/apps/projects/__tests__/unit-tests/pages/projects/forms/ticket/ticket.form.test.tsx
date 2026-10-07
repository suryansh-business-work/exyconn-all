import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskPriority, TaskType } from '@exyconn/shell/graphql/generated';
import { TicketForm, type TicketRow } from '../../../../../../src/pages/projects/forms/ticket';
import { renderWithProviders } from '../../../../test-utils';
import { taskRow } from '../../../../fixtures';
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

const ASSIGNEES = [{ value: 'emp-1', label: 'Asha Rao' }];
const onSubmit = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: TicketRow | null = null) =>
  renderWithProviders(
    <TicketForm initial={initial} assignees={ASSIGNEES} onSubmit={onSubmit} onCancel={onCancel} />,
  );

describe('TicketForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onSubmit.mockResolvedValue(undefined);
  });

  it('asks for a summary', async () => {
    renderForm();

    await press('Save ticket');

    expect(await screen.findByText('Summary is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ['-1', 'Points cannot be negative'],
    ['1000', 'Points must be ≤ 999'],
    ['2.5', 'Points must be whole'],
  ])('refuses %s story points', async (points, message) => {
    renderForm();
    fill('Summary', 'Fix login');
    fill('Story points', points);

    await press('Save ticket');

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('offers the types, priorities and people in the order they should be offered', async () => {
    renderForm();

    expect(await optionsOf(/^Type/)).toEqual(['Story', 'Task', 'Bug', 'Epic']);
    expect(await optionsOf(/^Priority/)).toEqual(['Highest', 'High', 'Medium', 'Low', 'Lowest']);
    expect(await optionsOf(/^Assignee/)).toEqual(['Unassigned', 'Asha Rao']);
  });

  it('files a new ticket as an unassigned, unsized medium task by default', async () => {
    renderForm();
    fill('Summary', '  Fix login  ');

    await press('Save ticket');

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Fix login',
        description: '',
        type: TaskType.Task,
        priority: TaskPriority.Medium,
        assigneeId: '',
        labels: [],
        storyPoints: null,
        dueDate: null,
      }),
    );
  });

  it('sends everything a ticket was given', async () => {
    renderForm();
    fill('Summary', 'Fix login');
    fill('Description', '<p>Steps to reproduce</p>');
    await pickOption(/^Type/, 'Bug');
    await pickOption(/^Priority/, 'Highest');
    const assignee = screen.getByRole('combobox', { name: /^Assignee/ });
    expect(assignee).toHaveValue('Unassigned');
    await userEvent.clear(assignee);
    await userEvent.type(assignee, 'Asha');
    await userEvent.click(await screen.findByRole('option', { name: 'Asha Rao' }));
    fill('Story points', '999');
    pickDate('dueDate', '10/31/2026');
    await userEvent.type(screen.getByRole('combobox', { name: /^Labels/ }), 'auth{Enter}');

    await press('Save ticket');

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Fix login',
        description: '<p>Steps to reproduce</p>',
        type: TaskType.Bug,
        priority: TaskPriority.Highest,
        assigneeId: 'emp-1',
        labels: ['auth'],
        storyPoints: 999,
        dueDate: localIso(2026, 9, 31),
      }),
    );
  });

  it('opens an existing ticket as it stands and saves it back unchanged', async () => {
    renderForm(
      taskRow({
        description: '<p>Old</p>',
        assigneeId: 'emp-1',
        labels: ['ui'],
        storyPoints: 0,
        dueDate: '2026-11-01T00:00:00.000Z',
      }),
    );
    expect(screen.getByLabelText('Summary')).toHaveValue('Login fails');
    expect(screen.getByLabelText('Story points')).toHaveValue('0');

    await press('Save ticket');

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Login fails',
        description: '<p>Old</p>',
        type: TaskType.Bug,
        priority: TaskPriority.High,
        assigneeId: 'emp-1',
        labels: ['ui'],
        storyPoints: 0,
        dueDate: '2026-11-01T00:00:00.000Z',
      }),
    );
  });

  it('hands Cancel back without saving', async () => {
    renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
