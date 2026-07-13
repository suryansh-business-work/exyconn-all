import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, IconButton, Flex, Text } from '@/components/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { TaskView } from './types';

interface TaskCardProps {
  task: TaskView;
  onDelete: (id: string) => void;
}

/** A draggable task card inside a column. */
export function TaskCard({ task, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId: task.columnId },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        p: 1.25,
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        boxShadow: 1,
        opacity: isDragging ? 0.4 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Flex direction="row" alignItems="flex-start" spacing={0.5}>
        <IconButton size="small" sx={{ cursor: 'grab', mt: -0.5 }} {...attributes} {...listeners}>
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" sx={{ wordBreak: 'break-word' }}>
            {task.title}
          </Text>
          {task.description && (
            <Text size="caption" color="text.secondary">
              {task.description}
            </Text>
          )}
        </Box>
        <IconButton size="small" onClick={() => onDelete(task.id)} aria-label="Delete task">
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Flex>
    </Box>
  );
}
