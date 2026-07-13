import { useCallback, useState } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
        const oldIndex = columns.findIndex((c) => c.id === active.id);
        const newIndex = columns.findIndex((c) => c.id === overColumnId);
        if (oldIndex < 0 || newIndex < 0) return;
        const next = arrayMove(columns, oldIndex, newIndex);
        setColumns(next);
        persistColumnOrder(next.map((c) => c.id));
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
      setTasks((prev) => applyTaskMove(prev, taskId, toColumnId as string, toIndex));
      persistTaskMove(taskId, toColumnId, toIndex < 0 ? 0 : toIndex);
    },
    [columns, tasks, setColumns, setTasks, persistColumnOrder, persistTaskMove],
  );

  return { sensors, activeTask, onDragStart, onDragEnd };
}
