import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useT } from '@exyconn/i18n';
import { SortableKanbanItem } from '@exyconn/kanban';
import { Flex } from '@exyconn/shell/components/ui';
import { TaskCard } from './TaskCard';
import type { TaskView } from './types';

interface ColumnTaskListProps {
  columnId: string;
  tasks: TaskView[];
  onOpenTask: (id: string) => void;
}

/** A column's tickets, top to bottom, each carried by its grip to another slot or column. */
export function ColumnTaskList({ columnId, tasks, onOpenTask }: Readonly<ColumnTaskListProps>) {
  const t = useT();
  return (
    <Flex direction="column" spacing={1} sx={{ overflowY: 'auto', flex: 1, minHeight: 8, pr: 0.5 }}>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableKanbanItem
            key={task.id}
            id={task.id}
            column={columnId}
            dragLabel={t('Drag {key}', { key: task.key })}
          >
            {(grip) => <TaskCard task={task} grip={grip} onOpen={onOpenTask} />}
          </SortableKanbanItem>
        ))}
      </SortableContext>
    </Flex>
  );
}
