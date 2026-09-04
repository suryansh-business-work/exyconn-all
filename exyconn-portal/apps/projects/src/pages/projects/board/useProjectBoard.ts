import { useCallback, useEffect, useState } from 'react';
import {
  useProjectBoardQuery,
  useCreateColumnMutation,
  useRenameColumnMutation,
  useDeleteColumnMutation,
  useReorderColumnsMutation,
  useCreateTaskMutation,
  useMoveTaskMutation,
} from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import type { ColumnView, TaskView } from './types';

/**
 * Loads a project's board into local state and exposes the column CRUD, the quick-add and
 * the two persistence calls the drag-and-drop layer needs.
 *
 * Local state is what makes a drag feel instant: the card moves on drop and the mutation
 * follows. Everything a ticket dialog changes goes back through `reload`, because a saved
 * ticket can change fields this hook does not track field by field.
 */
export function useProjectBoard(projectId: string) {
  const notify = useNotify();
  const { data, loading, refetch } = useProjectBoardQuery({
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });

  const [columns, setColumns] = useState<ColumnView[]>([]);
  const [tasks, setTasks] = useState<TaskView[]>([]);

  useEffect(() => {
    const board = data?.projectBoard;
    if (!board) return;
    setColumns(board.columns.map((c) => ({ id: c.id, name: c.name })));
    setTasks(board.tasks);
  }, [data]);

  const [createColumn] = useCreateColumnMutation();
  const [renameColumn] = useRenameColumnMutation();
  const [deleteColumn] = useDeleteColumnMutation();
  const [reorderColumns] = useReorderColumnsMutation();
  const [createTask] = useCreateTaskMutation();
  const [moveTask] = useMoveTaskMutation();

  const fail = useCallback(
    (e: unknown) => notify(e instanceof Error ? e.message : 'Action failed', 'error'),
    [notify],
  );

  const reload = useCallback(() => {
    refetch().catch(fail);
  }, [refetch, fail]);

  const addColumn = useCallback(
    async (name: string) => {
      await createColumn({ variables: { projectId, name } }).catch(fail);
      reload();
    },
    [createColumn, projectId, fail, reload],
  );

  const editColumn = useCallback(
    async (id: string, name: string) => {
      setColumns((p) => p.map((c) => (c.id === id ? { ...c, name } : c)));
      await renameColumn({ variables: { id, name } }).catch(fail);
    },
    [renameColumn, fail],
  );

  const removeColumn = useCallback(
    async (id: string) => {
      setColumns((p) => p.filter((c) => c.id !== id));
      setTasks((p) => p.filter((t) => t.columnId !== id));
      await deleteColumn({ variables: { id } }).catch(fail);
    },
    [deleteColumn, fail],
  );

  /** The board's quick-add: a title in a column, everything else on the ticket's defaults. */
  const addTask = useCallback(
    async (columnId: string, title: string) => {
      await createTask({ variables: { projectId, columnId, input: { title } } }).catch(fail);
      reload();
    },
    [createTask, projectId, fail, reload],
  );

  const persistColumnOrder = useCallback(
    (columnIds: string[]) => {
      reorderColumns({ variables: { projectId, columnIds } }).catch(fail);
    },
    [reorderColumns, projectId, fail],
  );

  const persistTaskMove = useCallback(
    (id: string, toColumnId: string, toIndex: number) => {
      moveTask({ variables: { id, toColumnId, toIndex } }).catch(fail);
    },
    [moveTask, fail],
  );

  return {
    loading,
    columns,
    tasks,
    setColumns,
    setTasks,
    addColumn,
    editColumn,
    removeColumn,
    addTask,
    persistColumnOrder,
    persistTaskMove,
    reload,
  };
}

export type ProjectBoardApi = ReturnType<typeof useProjectBoard>;
