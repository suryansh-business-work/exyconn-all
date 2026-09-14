import { useMemo } from 'react';
import type { Active, Announcements, Over, ScreenReaderInstructions } from '@dnd-kit/core';
import { useT } from '@exyconn/i18n';
import type { ColumnView, TaskView } from './types';

type Translate = ReturnType<typeof useT>;

interface BoardNames {
  columns: ColumnView[];
  tasks: TaskView[];
}

const isColumn = (item: Active | Over) => item.data.current?.type === 'column';

const taskTitle = ({ tasks }: BoardNames, id: string | number) =>
  tasks.find((task) => task.id === id)?.title ?? '';

/** The column a drop target stands for: the column itself, or the column a task sits in. */
function overColumn({ columns, tasks }: BoardNames, over: Over) {
  const columnId = isColumn(over) ? over.id : tasks.find((task) => task.id === over.id)?.columnId;
  return columns.find((column) => column.id === columnId);
}

function pickedUp(board: BoardNames, t: Translate, active: Active) {
  if (isColumn(active)) {
    const name = board.columns.find((column) => column.id === active.id)?.name ?? '';
    return t('Picked up column {name}.', { name });
  }
  return t('Picked up task {title}.', { title: taskTitle(board, active.id) });
}

function overText(board: BoardNames, t: Translate, active: Active, over: Over | null) {
  const column = over ? overColumn(board, over) : undefined;
  if (!column) {
    return t('Not over a column.');
  }
  if (isColumn(active)) {
    return t('Over column {column}.', { column: column.name });
  }
  return t('Task {title} is over {column}.', {
    title: taskTitle(board, active.id),
    column: column.name,
  });
}

function endText(board: BoardNames, t: Translate, active: Active, over: Over | null) {
  const column = over ? overColumn(board, over) : undefined;
  if (!column) {
    return t('Moving cancelled.');
  }
  if (isColumn(active)) {
    const position = board.columns.findIndex((item) => item.id === column.id) + 1;
    return t('Column moved to position {position}.', { position });
  }
  return t('Task {title} moved to {column}.', {
    title: taskTitle(board, active.id),
    column: column.name,
  });
}

/** What a screen reader hears while a card or a column is carried across the board. */
export function useBoardAnnouncements(columns: ColumnView[], tasks: TaskView[]) {
  const t = useT();
  return useMemo(() => {
    const board: BoardNames = { columns, tasks };
    const screenReaderInstructions: ScreenReaderInstructions = {
      draggable: t(
        'To pick up a task or a column, press Space or Enter. Use the arrow keys to move it, then press Space or Enter to drop it, or Escape to cancel.',
      ),
    };
    const announcements: Announcements = {
      onDragStart: ({ active }) => pickedUp(board, t, active),
      onDragOver: ({ active, over }) => overText(board, t, active, over),
      onDragEnd: ({ active, over }) => endText(board, t, active, over),
      onDragCancel: () => t('Moving cancelled.'),
    };
    return { screenReaderInstructions, announcements };
  }, [columns, tasks, t]);
}
