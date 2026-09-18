import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useT } from '@exyconn/i18n';
import {
  Avatar,
  Box,
  Chip,
  Flex,
  IconButton,
  Text,
  fontSize,
  fontWeight,
} from '@exyconn/shell/components/ui';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { TICKET_PRIORITIES, TICKET_TYPES, initialsOf } from '../ticket/ticket-meta';
import { TicketFacetIcon } from '../ticket/TicketFacetIcon';
import type { TaskView } from './types';

type Translate = ReturnType<typeof useT>;

/**
 * What the card says to a screen reader. The glyphs and the avatar inside it are hidden, so
 * everything they show — type, priority, points, assignee, labels — is spelled out here.
 */
function cardLabel(task: TaskView, t: Translate) {
  const parts = [
    t('{key}: {title}', { key: task.key, title: task.title }),
    t('{kind}: {facet}', { kind: t('Type'), facet: t(TICKET_TYPES[task.type].label) }),
    t('{kind}: {facet}', { kind: t('Priority'), facet: t(TICKET_PRIORITIES[task.priority].label) }),
  ];
  if (task.storyPoints !== null && task.storyPoints !== undefined) {
    parts.push(t('{points} points', { points: task.storyPoints }));
  }
  if (task.assigneeName !== '') {
    parts.push(t('Assigned to {name}', { name: task.assigneeName }));
  }
  if (task.labels.length > 0) {
    parts.push(t('Labels: {labels}', { labels: task.labels.join(', ') }));
  }
  return parts.join(', ');
}

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
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId: task.columnId },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        p: 1.5,
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
          aria-label={t('Drag {key}', { key: task.key })}
          sx={{ cursor: 'grab', mt: -0.5 }}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box
          role="button"
          tabIndex={0}
          aria-label={cardLabel(task, t)}
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

          <Flex direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            <TicketFacetIcon facet={TICKET_TYPES[task.type]} kind="Type" decorative />
            <TicketFacetIcon facet={TICKET_PRIORITIES[task.priority]} kind="Priority" decorative />
            <Text size="caption" color="text.secondary" sx={{ fontWeight: fontWeight.semibold }}>
              {task.key}
            </Text>
            {task.storyPoints !== null && task.storyPoints !== undefined ? (
              <Chip
                size="small"
                label={task.storyPoints}
                sx={{ height: 18, fontSize: fontSize['2xs'] }}
              />
            ) : null}
            <Box sx={{ flex: 1 }} />
            {task.assigneeName === '' ? null : (
              <Avatar alt="" aria-hidden sx={{ width: 22, height: 22, fontSize: fontSize['3xs'] }}>
                {initialsOf(task.assigneeName)}
              </Avatar>
            )}
          </Flex>

          {task.labels.length > 0 ? (
            <Flex direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {task.labels.map((label) => (
                <Chip
                  key={label}
                  size="small"
                  variant="outlined"
                  label={label}
                  sx={{ height: 18, fontSize: fontSize['2xs'] }}
                />
              ))}
            </Flex>
          ) : null}
        </Box>
      </Flex>
    </Box>
  );
}
