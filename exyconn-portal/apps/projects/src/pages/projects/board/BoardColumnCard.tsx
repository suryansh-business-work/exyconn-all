import { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, IconButton, Flex, TextField, Text } from '@exyconn/shell/components/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { TaskCard } from './TaskCard';
import { AddItemInput } from './AddItemInput';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import type { ColumnView, TaskView } from './types';

interface BoardColumnCardProps {
  column: ColumnView;
  tasks: TaskView[];
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddTask: (columnId: string, title: string) => void;
  onOpenTask: (id: string) => void;
}

/** A draggable kanban column hosting a vertical sortable list of tickets. */
export function BoardColumnCard({
  column,
  tasks,
  onRename,
  onDelete,
  onAddTask,
  onOpenTask,
}: Readonly<BoardColumnCardProps>) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' },
  });

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== column.name) onRename(column.id, trimmed);
    else setName(column.name);
    setEditing(false);
  };

  const remove = async () => {
    const ok = await confirm({
      message: `Delete column "${column.name}" and its tickets?`,
      confirmText: 'Delete',
    });
    if (ok) onDelete(column.id);
  };

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: 280,
        flexShrink: 0,
        p: 1.25,
        borderRadius: 2,
        bgcolor: 'action.hover',
        opacity: isDragging ? 0.5 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
      }}
    >
      <Flex direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
        <IconButton size="small" sx={{ cursor: 'grab' }} {...attributes} {...listeners}>
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
        {editing ? (
          <TextField
            autoFocus
            size="small"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <Text size="label" sx={{ flex: 1, cursor: 'text' }} onClick={() => setEditing(true)}>
            {column.name}{' '}
            <Text component="span" size="caption" color="text.secondary">
              ({tasks.length})
            </Text>
          </Text>
        )}
        <IconButton size="small" onClick={remove} aria-label="Delete column">
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Flex>

      <Flex
        direction="column"
        spacing={1}
        sx={{ overflowY: 'auto', flex: 1, minHeight: 8, pr: 0.5 }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>
      </Flex>

      <Box sx={{ mt: 1 }}>
        <AddItemInput
          label="Add ticket"
          placeholder="Ticket summary"
          onAdd={(v) => onAddTask(column.id, v)}
        />
      </Box>
    </Box>
  );
}
