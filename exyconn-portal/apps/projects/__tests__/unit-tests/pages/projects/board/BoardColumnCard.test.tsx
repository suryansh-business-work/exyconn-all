import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardColumnCard } from '../../../../../src/pages/projects/board';
import type { ColumnView } from '../../../../../src/pages/projects/board';
import { renderWithProviders } from '../../../test-utils';
import { taskRow } from '../../../fixtures';
import { DndWrapper } from './dnd-wrapper';

const handlers = {
  onMoveColumn: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
  onAddTask: vi.fn(),
  onOpenTask: vi.fn(),
  onToggleDone: vi.fn(),
};

const TASKS = [taskRow(), taskRow({ id: 'task-2', key: 'EXY-2', title: 'Logout hangs' })];

const renderColumn = (column: Partial<ColumnView> = {}) =>
  renderWithProviders(
    <DndWrapper ids={['col-1']}>
      <BoardColumnCard
        column={{ id: 'col-1', name: 'To do', isDone: false, ...column }}
        index={0}
        columnCount={2}
        tasks={TASKS}
        {...handlers}
      />
    </DndWrapper>,
  );

const nameButton = () => screen.getByRole('button', { name: 'Rename column To do' });
const nameField = () => screen.getByRole('textbox', { name: 'Column name' });

describe('BoardColumnCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the column name, how many tickets it holds, and every ticket', () => {
    renderColumn();

    expect(nameButton()).toHaveTextContent('To do (2)');
    expect(screen.getByRole('button', { name: /^EXY-1: Login fails/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^EXY-2: Logout hangs/ })).toBeInTheDocument();
  });

  it('renames the column with the trimmed name on Enter', async () => {
    renderColumn();
    await userEvent.click(nameButton());

    await userEvent.clear(nameField());
    await userEvent.type(nameField(), '  Doing  {Enter}');

    expect(handlers.onRename).toHaveBeenCalledWith('col-1', 'Doing');
    expect(screen.queryByRole('textbox', { name: 'Column name' })).not.toBeInTheDocument();
  });

  it('commits the name when the field loses focus', async () => {
    renderColumn();
    await userEvent.click(nameButton());
    await userEvent.type(nameField(), ' later');

    fireEvent.blur(nameField());

    expect(handlers.onRename).toHaveBeenCalledWith('col-1', 'To do later');
  });

  it('keeps the old name for a blank or unchanged one', async () => {
    renderColumn();
    await userEvent.click(nameButton());
    await userEvent.clear(nameField());
    await userEvent.type(nameField(), '   {Enter}');
    expect(nameButton()).toHaveTextContent('To do (2)');

    await userEvent.click(nameButton());
    expect(nameField()).toHaveValue('To do');
    await userEvent.type(nameField(), '{Enter}');

    expect(handlers.onRename).not.toHaveBeenCalled();
  });

  it('starts renaming from the keyboard and stops on Escape without saving', async () => {
    renderColumn();

    fireEvent.keyDown(nameButton(), { key: 'Enter' });
    await userEvent.type(nameField(), '{Escape}');
    expect(screen.queryByRole('textbox', { name: 'Column name' })).not.toBeInTheDocument();

    fireEvent.keyDown(nameButton(), { key: 'Tab' });
    expect(screen.queryByRole('textbox', { name: 'Column name' })).not.toBeInTheDocument();

    fireEvent.keyDown(nameButton(), { key: ' ' });
    expect(nameField()).toBeInTheDocument();
    expect(handlers.onRename).not.toHaveBeenCalled();
  });

  it('marks a column as the end of the line, and unmarks it', async () => {
    renderColumn();
    await userEvent.click(screen.getByRole('button', { name: 'Count as done' }));
    expect(handlers.onToggleDone).toHaveBeenLastCalledWith('col-1', true);
  });

  it('offers to stop counting a done column as done', async () => {
    renderColumn({ isDone: true });
    await userEvent.click(screen.getByRole('button', { name: 'Stop counting as done' }));
    expect(handlers.onToggleDone).toHaveBeenLastCalledWith('col-1', false);
  });

  it('deletes the column only once the delete is confirmed', async () => {
    renderColumn();

    await userEvent.click(screen.getByRole('button', { name: 'Delete column' }));
    expect(await screen.findByText('Delete column "To do" and its tickets?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(handlers.onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete column' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(handlers.onDelete).toHaveBeenCalledWith('col-1');
  });

  it('moves the column right, adds a ticket to it and opens a ticket in it', async () => {
    renderColumn();

    await userEvent.click(screen.getByRole('button', { name: 'Move column right' }));
    expect(handlers.onMoveColumn).toHaveBeenCalledWith('col-1', 1);

    await userEvent.click(screen.getByRole('button', { name: 'Add ticket' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Ticket summary' }), 'New{Enter}');
    expect(handlers.onAddTask).toHaveBeenCalledWith('col-1', 'New');

    await userEvent.click(screen.getByRole('button', { name: /^EXY-2: Logout hangs/ }));
    expect(handlers.onOpenTask).toHaveBeenCalledWith('task-2');
  });

  it('can be dragged by its grip', () => {
    renderColumn();

    expect(screen.getByRole('button', { name: 'Drag to reorder column' })).toBeInTheDocument();
  });
});
