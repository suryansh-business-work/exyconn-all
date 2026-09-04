import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, Box, Chip, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { TICKET_PRIORITIES, TICKET_TYPES, initialsOf } from '../ticket/ticket-meta';
import { TicketFacetIcon } from '../ticket/TicketFacetIcon';
import type { TaskView } from './types';

interface TaskCardProps {
  task: TaskView;
  onOpen: (id: string) => void;
}

/**
 * A draggable ticket card. It reads the way a board card has to: the handle, the summary,
 * then one line of the things you scan a board for — key, type, priority, points, assignee.
 * The card body opens the ticket; only the grip drags it, so a click never starts a drag.
 */
export function TaskCard({ task, onOpen }: Readonly<TaskCardProps>) {
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
        <IconButton
          size="small"
          aria-label={`Drag ${task.key}`}
          sx={{ cursor: 'grab', mt: -0.5 }}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box
          role="button"
          tabIndex={0}
          onClick={() => onOpen(task.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onOpen(task.id);
            }
          }}
          sx={{ flex: 1, minWidth: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          <Text size="sm" sx={{ wordBreak: 'break-word' }}>
            {task.title}
          </Text>

          <Flex direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.75 }}>
            <TicketFacetIcon facet={TICKET_TYPES[task.type]} kind="Type" />
            <TicketFacetIcon facet={TICKET_PRIORITIES[task.priority]} kind="Priority" />
            <Text size="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {task.key}
            </Text>
            {task.storyPoints !== null && task.storyPoints !== undefined ? (
              <Chip size="small" label={task.storyPoints} sx={{ height: 18, fontSize: 11 }} />
            ) : null}
            <Box sx={{ flex: 1 }} />
            {task.assigneeName === '' ? null : (
              <Tooltip title={`Assigned to ${task.assigneeName}`}>
                <Avatar sx={{ width: 22, height: 22, fontSize: 10 }}>
                  {initialsOf(task.assigneeName)}
                </Avatar>
              </Tooltip>
            )}
          </Flex>

          {task.labels.length > 0 ? (
            <Flex direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
              {task.labels.map((label) => (
                <Chip
                  key={label}
                  size="small"
                  variant="outlined"
                  label={label}
                  sx={{ height: 18, fontSize: 11 }}
                />
              ))}
            </Flex>
          ) : null}
        </Box>
      </Flex>
    </Box>
  );
}
