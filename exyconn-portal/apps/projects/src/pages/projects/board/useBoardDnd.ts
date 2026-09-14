import { useCallback, useState } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
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

/** Wires dnd-kit sensors and commit logic for the board: horizontal column
 *  reordering and task move/reorder across columns. */
export function useBoardDnd(api: ProjectBoardApi) {
  const { columns, tasks, setColumns, setTasks, persistColumnOrder, persistTaskMove } = api;
  const [activeTask, setActiveTask] = useState<TaskView | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // A finger has to hold before it drags: the board scrolls sideways under it, and a
    // pointer sensor alone reads the first flick of that scroll as picking a card up.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    // Space or Enter on a grip picks it up, the arrow keys carry it, Space or Enter drops it.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
      persistTaskMove(taskId, toColumnId, toIndex < 0 ? 0 : toIndex);
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

  const onDragStart = useCallback(
    (e: DragStartEvent) => {
      if (e.active.data.current?.type === 'task') {
        setActiveTask(tasks.find((t) => t.id === e.active.id) ?? null);
      }
    },
    [tasks],
  );

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = e;
      if (!over) return;
      const overType = over.data.current?.type;

      if (active.data.current?.type === 'column') {
        const overColumnId =
          overType === 'column' ? String(over.id) : columnIdOf(tasks, String(over.id));
        if (!overColumnId || overColumnId === active.id) return;
        moveColumn(
          String(active.id),
          columns.findIndex((c) => c.id === overColumnId),
        );
        return;
      }

      // Task drag — resolve the destination column and index from the drop target.
      const taskId = String(active.id);
      let toColumnId: string | undefined;
      let toIndex: number;
      if (overType === 'task') {
        toColumnId = columnIdOf(tasks, String(over.id));
        const colTasks = tasks.filter((t) => t.columnId === toColumnId);
        toIndex = colTasks.findIndex((t) => t.id === over.id);
      } else {
        toColumnId = String(over.id); // dropped on a column container
        toIndex = tasks.filter((t) => t.columnId === toColumnId).length;
      }
      if (!toColumnId) return;
      moveTask(taskId, toColumnId, toIndex);
    },
    [columns, tasks, moveColumn, moveTask],
  );

  const onDragCancel = useCallback(() => setActiveTask(null), []);

  return {
    sensors,
    activeTask,
    onDragStart,
    onDragEnd,
    onDragCancel,
    moveColumn,
    moveTaskToColumn,
  };
}
