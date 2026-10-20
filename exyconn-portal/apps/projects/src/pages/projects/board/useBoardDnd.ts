import { useCallback, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { arrangeBoard, useKanbanDnd, useKanbanSensors, type DropTarget } from '@exyconn/kanban';
import type { ProjectBoardApi } from './useProjectBoard';
import type { TaskView } from './types';

const columnIdOf = (tasks: TaskView[], taskId: string) =>
  tasks.find((t) => t.id === taskId)?.columnId;

/** Reinserts a task into a target column at a given index; per-column relative
 *  order is preserved by filtering, so global array order is irrelevant. */
function applyTaskMove(tasks: TaskView[], taskId: string, toColumnId: string, toIndex: number) {
  const moving = tasks.find((t) => t.id === taskId);
  if (!moving) return tasks;
  const remaining = tasks.filter((t) => t.id !== taskId);
  const target = remaining.filter((t) => t.columnId === toColumnId);
  const others = remaining.filter((t) => t.columnId !== toColumnId);
  target.splice(Math.max(0, Math.min(toIndex, target.length)), 0, {
    ...moving,
    columnId: toColumnId,
  });
  return [...others, ...target];
}

/** Wires the board's drag: horizontal column reordering here, and the shared kanban drag
 *  (live drop preview, placeholder, overlay) for tickets across columns. */
export function useBoardDnd(api: ProjectBoardApi) {
  const { columns, tasks, setColumns, setTasks, persistColumnOrder, persistTaskMove } = api;
  const sensors = useKanbanSensors();

  /** Moves a column to a position — the drag's commit, and the header's left/right buttons. */
  const moveColumn = useCallback(
    (columnId: string, toIndex: number) => {
      const oldIndex = columns.findIndex((c) => c.id === columnId);
      if (oldIndex < 0 || toIndex < 0 || toIndex >= columns.length || oldIndex === toIndex) return;
      const next = arrayMove(columns, oldIndex, toIndex);
      setColumns(next);
      persistColumnOrder(next.map((c) => c.id));
    },
    [columns, setColumns, persistColumnOrder],
  );

  /** Puts a task into a column at an index — the drag's commit. */
  const moveTask = useCallback(
    (taskId: string, toColumnId: string, toIndex: number) => {
      setTasks((prev) => applyTaskMove(prev, taskId, toColumnId, toIndex));
      persistTaskMove(taskId, toColumnId, Math.max(0, toIndex));
    },
    [setTasks, persistTaskMove],
  );

  /** Sends a task to the end of a column — the ticket dialog's Column select. */
  const moveTaskToColumn = useCallback(
    (taskId: string, toColumnId: string) => {
      const toIndex = tasks.filter((t) => t.columnId === toColumnId && t.id !== taskId).length;
      moveTask(taskId, toColumnId, toIndex);
    },
    [tasks, moveTask],
  );

  const settled = useMemo(
    () =>
      arrangeBoard(
        tasks.map((task) => ({ id: task.id, column: task.columnId })),
        columns.map((column) => column.id),
      ),
    [tasks, columns],
  );
  const cards = useKanbanDnd({
    layout: settled,
    onDrop: (id: string, target: DropTarget) => moveTask(id, target.column, target.index),
  });

  /** A column drag commits here; a ticket drag is the shared kanban's. */
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (active.data.current?.type !== 'column') {
      cards.onDragEnd(e);
      return;
    }
    if (!over) return;
    const overColumnId =
      over.data.current?.type === 'column' ? String(over.id) : columnIdOf(tasks, String(over.id));
    if (!overColumnId || overColumnId === active.id) return;
    moveColumn(
      String(active.id),
      columns.findIndex((c) => c.id === overColumnId),
    );
  };

  return {
    sensors,
    layout: cards.layout,
    activeTask: tasks.find((task) => task.id === cards.activeId) ?? null,
    targetColumn: cards.targetColumn,
    onDragStart: cards.onDragStart,
    onDragOver: cards.onDragOver,
    onDragEnd,
    onDragCancel: cards.onDragCancel,
    moveColumn,
    moveTaskToColumn,
  };
}
