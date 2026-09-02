import { useCallback, useEffect, useState } from 'react';
import {
  useProjectBoardQuery,
  useCreateColumnMutation,
  useRenameColumnMutation,
  useDeleteColumnMutation,
  useReorderColumnsMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
} from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import type { ColumnView, TaskView } from './types';

/** Loads a project's board into local state and exposes CRUD + persistence
 *  helpers used by the drag-and-drop layer. */
export function useProjectBoard(projectId: string) {
  const notify = useNotify();
  const { data, loading } = useProjectBoardQuery({
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });

  const [columns, setColumns] = useState<ColumnView[]>([]);
  const [tasks, setTasks] = useState<TaskView[]>([]);

  useEffect(() => {
    const board = data?.projectBoard;
    if (!board) return;
    setColumns(board.columns.map((c) => ({ id: c.id, name: c.name })));
    setTasks(
      board.tasks.map((t) => ({
        id: t.id,
        columnId: t.columnId,
        title: t.title,
        description: t.description,
      })),
    );
  }, [data]);

  const [createColumn] = useCreateColumnMutation();
  const [renameColumn] = useRenameColumnMutation();
  const [deleteColumn] = useDeleteColumnMutation();
  const [reorderColumns] = useReorderColumnsMutation();
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [moveTask] = useMoveTaskMutation();

  const fail = useCallback(
    (e: unknown) => notify(e instanceof Error ? e.message : 'Action failed', 'error'),
    [notify],
  );

  const addColumn = useCallback(
    async (name: string) => {
      const { data: res } = await createColumn({ variables: { projectId, name } }).catch((e) => {
        fail(e);
        return { data: null };
      });
      if (res?.createColumn) setColumns((p) => [...p, { id: res.createColumn.id, name }]);
    },
    [createColumn, projectId, fail],
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

  const addTask = useCallback(
    async (columnId: string, title: string) => {
      const { data: res } = await createTask({
        variables: { projectId, columnId, title },
      }).catch((e) => {
        fail(e);
        return { data: null };
      });
      if (res?.createTask) {
        setTasks((p) => [...p, { id: res.createTask.id, columnId, title, description: null }]);
      }
    },
    [createTask, projectId, fail],
  );

  const editTask = useCallback(
    async (id: string, patch: { title?: string; description?: string | null }) => {
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      await updateTask({ variables: { id, ...patch } }).catch(fail);
    },
    [updateTask, fail],
  );

  const removeTask = useCallback(
    async (id: string) => {
      setTasks((p) => p.filter((t) => t.id !== id));
      await deleteTask({ variables: { id } }).catch(fail);
    },
    [deleteTask, fail],
  );

  const persistColumnOrder = useCallback(
    (columnIds: string[]) => {
      void reorderColumns({ variables: { projectId, columnIds } }).catch(fail);
    },
    [reorderColumns, projectId, fail],
  );

  const persistTaskMove = useCallback(
    (id: string, toColumnId: string, toIndex: number) => {
      void moveTask({ variables: { id, toColumnId, toIndex } }).catch(fail);
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
    editTask,
    removeTask,
    persistColumnOrder,
    persistTaskMove,
  };
}

export type ProjectBoardApi = ReturnType<typeof useProjectBoard>;
