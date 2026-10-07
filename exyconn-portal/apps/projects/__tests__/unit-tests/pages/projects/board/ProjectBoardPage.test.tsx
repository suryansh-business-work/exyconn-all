import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectBoardPage, type ProjectBoardApi } from '../../../../../src/pages/projects/board';
import { BACKLOG } from '../../../../../src/pages/projects/sprints/sprint-progress';
import { renderWithProviders } from '../../../test-utils';
import { boardApi, dialog } from './board-page.mocks';

const state = vi.hoisted(() => ({ board: null as unknown, projectId: '' }));

vi.mock('../../../../../src/pages/projects/board/useProjectBoard', () => ({
  useProjectBoard: (projectId: string) => {
    state.projectId = projectId;
    return state.board;
  },
}));

vi.mock('../../../../../src/pages/projects/ticket/TicketDialog', async () => ({
  TicketDialog: (await import('./board-page.mocks')).TicketDialogStub,
}));

const board = () => state.board as ProjectBoardApi;
/** The button named `name` in the column at `index` — columns render left to right. */
const columnButton = (name: string, index: number) =>
  screen.getAllByRole('button', { name })[index];
const cardNames = () =>
  screen.getAllByRole('button', { name: /^EXY-\d: / }).map((card) => card.textContent);

const renderBoard = (sprintFilter = '') =>
  renderWithProviders(<ProjectBoardPage projectId="proj-1" sprintFilter={sprintFilter} />);

describe('ProjectBoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.board = boardApi();
  });

  it('shows a spinner while the first load is on its way', () => {
    state.board = boardApi({ loading: true, columns: [], tasks: [] });
    renderBoard();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add column' })).not.toBeInTheDocument();
  });

  it('keeps the board on screen while a reload is in flight', () => {
    state.board = boardApi({ loading: true });
    renderBoard();

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename column To do' })).toBeInTheDocument();
  });

  it('lays out the project’s own columns with every ticket in its column', () => {
    renderBoard();

    expect(state.projectId).toBe('proj-1');
    expect(screen.getByRole('button', { name: 'Rename column To do' })).toHaveTextContent('(2)');
    expect(screen.getByRole('button', { name: 'Rename column Done' })).toHaveTextContent('(1)');
    expect(cardNames()).toEqual(['Login failsEXY-1', 'Logout hangsEXY-2', 'Ship itEXY-3']);
  });

  it('shows only the tickets of the sprint being looked at', () => {
    renderBoard('s1');
    expect(cardNames()).toEqual(['Login failsEXY-1', 'Ship itEXY-3']);
  });

  it('shows the backlog as the tickets in no sprint', () => {
    renderBoard(BACKLOG);
    expect(cardNames()).toEqual(['Logout hangsEXY-2']);
  });

  it('opens a ticket in the dialog and closes it again', async () => {
    renderBoard();
    expect(dialog.props?.ticket).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /^EXY-2: / }));
    expect(screen.getByText('Ticket EXY-2 is open')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close ticket' }));
    expect(screen.queryByText(/is open/)).not.toBeInTheDocument();
  });

  it('reloads the board after the dialog saves, and moves a ticket from its column select', () => {
    renderBoard();

    act(() => dialog.props?.onChanged());
    expect(board().reload).toHaveBeenCalledTimes(1);

    expect(dialog.props?.board.columns).toBe(board().columns);
    act(() => dialog.props?.board.onMove('t1', 'done'));
    expect(board().persistTaskMove).toHaveBeenCalledWith('t1', 'done', 1);
    expect(board().setTasks).toHaveBeenCalledTimes(1);
  });

  it('adds a column from the end of the board', async () => {
    renderBoard();

    await userEvent.click(screen.getByRole('button', { name: 'Add column' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Column name' }), 'Review{Enter}');

    expect(board().addColumn).toHaveBeenCalledWith('Review');
  });

  it('wires each column’s controls to the board', async () => {
    renderBoard();

    await userEvent.click(screen.getByRole('button', { name: 'Count as done' }));
    expect(board().toggleColumnDone).toHaveBeenCalledWith('todo', true);

    await userEvent.click(columnButton('Move column right', 0));
    expect(board().persistColumnOrder).toHaveBeenCalledWith(['done', 'todo']);

    await userEvent.click(columnButton('Add ticket', 1));
    await userEvent.type(screen.getByRole('textbox', { name: 'Ticket summary' }), 'Demo{Enter}');
    expect(board().addTask).toHaveBeenCalledWith('done', 'Demo');

    await userEvent.click(screen.getByRole('button', { name: 'Rename column Done' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Column name' }), '!{Enter}');
    expect(board().editColumn).toHaveBeenCalledWith('done', 'Done!');
  });

  it('deletes a column once the delete is confirmed', async () => {
    renderBoard();

    await userEvent.click(columnButton('Delete column', 1));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(board().removeColumn).toHaveBeenCalledWith('done');
  });
});
