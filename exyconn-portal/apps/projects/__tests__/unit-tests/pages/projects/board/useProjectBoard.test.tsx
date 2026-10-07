import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { useProjectBoard } from '../../../../../src/pages/projects/board';
import { renderHookWithProviders } from '../../../test-utils';
import { taskRow } from '../../../fixtures';

const gql = vi.hoisted(() => ({
  board: vi.fn(),
  refetch: vi.fn(),
  createColumn: vi.fn(),
  renameColumn: vi.fn(),
  deleteColumn: vi.fn(),
  setColumnDone: vi.fn(),
  reorderColumns: vi.fn(),
  createTask: vi.fn(),
  moveTask: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectBoardQuery: (options: unknown) => gql.board(options),
  useCreateColumnMutation: () => [gql.createColumn],
  useRenameColumnMutation: () => [gql.renameColumn],
  useDeleteColumnMutation: () => [gql.deleteColumn],
  useSetColumnDoneMutation: () => [gql.setColumnDone],
  useReorderColumnsMutation: () => [gql.reorderColumns],
  useCreateTaskMutation: () => [gql.createTask],
  useMoveTaskMutation: () => [gql.moveTask],
}));

const BOARD = {
  projectBoard: {
    columns: [
      { __typename: 'BoardColumn', id: 'todo', name: 'To do', order: 0, isDone: false },
      { __typename: 'BoardColumn', id: 'done', name: 'Done', order: 1, isDone: true },
    ],
    tasks: [taskRow({ id: 't1', columnId: 'todo' }), taskRow({ id: 't2', columnId: 'done' })],
  },
};

const setup = () => renderHookWithProviders(() => useProjectBoard('proj-1'));

describe('useProjectBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.board.mockReturnValue({ data: BOARD, loading: false, refetch: gql.refetch });
    for (const mutation of [
      gql.createColumn,
      gql.renameColumn,
      gql.deleteColumn,
      gql.setColumnDone,
      gql.reorderColumns,
      gql.createTask,
      gql.moveTask,
    ]) {
      mutation.mockResolvedValue({ data: {} });
    }
  });

  it('loads the board, fresh from the network, into local columns and tasks', () => {
    const { result } = setup();

    expect(gql.board).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(result.current.columns).toEqual([
      { id: 'todo', name: 'To do', isDone: false },
      { id: 'done', name: 'Done', isDone: true },
    ]);
    expect(result.current.tasks.map((task) => task.id)).toEqual(['t1', 't2']);
    expect(result.current.loading).toBe(false);
  });

  it('starts empty while the board is loading', () => {
    gql.board.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    const { result } = setup();

    expect(result.current.columns).toEqual([]);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('adds a column and reloads the board', async () => {
    const { result } = setup();

    await act(() => result.current.addColumn('Review'));

    expect(gql.createColumn).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1', name: 'Review' },
    });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('reports a failed write and still reloads', async () => {
    gql.createTask.mockRejectedValueOnce(new Error('Column is gone'));
    const { result } = setup();

    await act(() => result.current.addTask('todo', 'Fix login'));

    expect(gql.createTask).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1', columnId: 'todo', input: { title: 'Fix login' } },
    });
    expect(await screen.findByText('Column is gone')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('renames a column at once and then saves the name', async () => {
    const { result } = setup();

    await act(() => result.current.editColumn('todo', 'Backlog'));

    expect(result.current.columns[0]).toEqual({ id: 'todo', name: 'Backlog', isDone: false });
    expect(result.current.columns[1].name).toBe('Done');
    expect(gql.renameColumn).toHaveBeenCalledWith({ variables: { id: 'todo', name: 'Backlog' } });
  });

  it('ticks a column as done at once and then saves it', async () => {
    const { result } = setup();

    await act(() => result.current.toggleColumnDone('todo', true));

    expect(result.current.columns.map((column) => column.isDone)).toEqual([true, true]);
    expect(gql.setColumnDone).toHaveBeenCalledWith({ variables: { id: 'todo', isDone: true } });
  });

  it('removes a column with its tickets at once and then deletes it', async () => {
    const { result } = setup();

    await act(() => result.current.removeColumn('todo'));

    expect(result.current.columns.map((column) => column.id)).toEqual(['done']);
    expect(result.current.tasks.map((task) => task.id)).toEqual(['t2']);
    expect(gql.deleteColumn).toHaveBeenCalledWith({ variables: { id: 'todo' } });
  });

  it('saves the column order and a ticket move without waiting on them', () => {
    const { result } = setup();

    act(() => {
      result.current.persistColumnOrder(['done', 'todo']);
      result.current.persistTaskMove('t1', 'done', 0);
    });

    expect(gql.reorderColumns).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1', columnIds: ['done', 'todo'] },
    });
    expect(gql.moveTask).toHaveBeenCalledWith({
      variables: { id: 't1', toColumnId: 'done', toIndex: 0 },
    });
  });

  it('reports a move that could not be saved, in general terms when the error says nothing', async () => {
    gql.moveTask.mockRejectedValueOnce('offline');
    const { result } = setup();

    act(() => result.current.persistTaskMove('t1', 'done', 0));

    expect(await screen.findByText('Action failed')).toBeInTheDocument();
  });

  it('reports a reload that fails', async () => {
    gql.refetch.mockRejectedValueOnce(new Error('Network down'));
    const { result } = setup();

    act(() => result.current.reload());

    await waitFor(() => expect(screen.getByText('Network down')).toBeInTheDocument());
  });

  it('reports a rename, a tick, a delete and a reorder that fail', async () => {
    gql.renameColumn.mockRejectedValueOnce(new Error('Rename refused'));
    gql.setColumnDone.mockRejectedValueOnce(new Error('Tick refused'));
    gql.deleteColumn.mockRejectedValueOnce(new Error('Delete refused'));
    gql.reorderColumns.mockRejectedValueOnce(new Error('Order refused'));
    const { result } = setup();

    await act(() => result.current.editColumn('todo', 'X'));
    expect(await screen.findByText('Rename refused')).toBeInTheDocument();
    await act(() => result.current.toggleColumnDone('todo', false));
    expect(await screen.findByText('Tick refused')).toBeInTheDocument();
    await act(() => result.current.removeColumn('done'));
    expect(await screen.findByText('Delete refused')).toBeInTheDocument();
    act(() => result.current.persistColumnOrder(['todo']));
    expect(await screen.findByText('Order refused')).toBeInTheDocument();
  });
});
