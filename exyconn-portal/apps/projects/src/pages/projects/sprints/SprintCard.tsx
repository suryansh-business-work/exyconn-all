import {
  Box,
  Button,
  Chip,
  Flex,
  IconButton,
  LinearProgress,
  Text,
} from '@exyconn/shell/components/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { SprintState, type SprintFieldsFragment } from '@exyconn/shell/graphql/generated';
import type { SprintProgress } from './sprint-progress';

/** The colour a sprint's state reads as, so a running sprint stands out in the list. */
const STATE_COLOR: Readonly<Record<SprintState, 'default' | 'success' | 'primary'>> = {
  [SprintState.Planned]: 'default',
  [SprintState.Active]: 'primary',
  [SprintState.Completed]: 'success',
};

interface SprintCardProps {
  sprint: SprintFieldsFragment;
  progress: SprintProgress;
  /** The sprint's window, already through the viewer's own date settings. */
  window: string;
  onStart: (sprint: SprintFieldsFragment) => void;
  onComplete: (sprint: SprintFieldsFragment) => void;
  onDelete: (sprint: SprintFieldsFragment) => void;
}

/**
 * One sprint in the list: its window and goal, committed against completed points, and the
 * one action its state allows. A plain MUI bar rather than a chart — the only question a
 * sprint row is asked is "how much of what we committed is done".
 */
export function SprintCard({
  sprint,
  progress,
  window,
  onStart,
  onComplete,
  onDelete,
}: Readonly<SprintCardProps>) {
  const isPlanned = sprint.state === SprintState.Planned;
  const isActive = sprint.state === SprintState.Active;

  return (
    <Box sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Flex direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Text size="label">{sprint.name}</Text>
        <Chip size="small" color={STATE_COLOR[sprint.state]} label={sprint.state} />
        <Box sx={{ flex: 1 }} />
        {isPlanned ? (
          <Button size="small" startIcon={<PlayArrowIcon />} onClick={() => onStart(sprint)}>
            Start
          </Button>
        ) : null}
        {isActive ? (
          <Button size="small" startIcon={<DoneAllIcon />} onClick={() => onComplete(sprint)}>
            Complete
          </Button>
        ) : null}
        <IconButton
          size="small"
          aria-label={`Delete sprint ${sprint.name}`}
          onClick={() => onDelete(sprint)}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Flex>

      <Text size="caption" color="text.secondary">
        {window}
        {sprint.goal ? ` · ${sprint.goal}` : ''}
      </Text>

      <Flex direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.5 }}>
        <LinearProgress
          variant="determinate"
          value={progress.percentComplete}
          aria-label={`${sprint.name} progress`}
          sx={{ flex: 1, height: 8, borderRadius: 1 }}
        />
        <Text size="caption" color="text.secondary" sx={{ minWidth: 150, textAlign: 'right' }}>
          {progress.completedPoints}/{progress.committedPoints} pts · {progress.completedTickets}/
          {progress.ticketCount} tickets
        </Text>
      </Flex>
    </Box>
  );
}
