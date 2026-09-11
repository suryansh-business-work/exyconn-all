import { useState } from 'react';
import {
  CARD_RADIUS,
  Box,
  Button,
  Chip,
  Flex,
  IconButton,
  Text,
} from '@exyconn/shell/components/ui';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditIcon from '@mui/icons-material/Edit';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  MilestoneState,
  useDeleteMilestoneMutation,
  useProjectMilestonesQuery,
  type MilestoneFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { MilestoneForm } from '../forms/milestone';

/** The colour a milestone's state reads as. A missed date is not quietly greyed out. */
const STATE_COLOR: Readonly<Record<MilestoneState, 'default' | 'info' | 'success' | 'error'>> = {
  [MilestoneState.Planned]: 'default',
  [MilestoneState.InProgress]: 'info',
  [MilestoneState.Hit]: 'success',
  [MilestoneState.Missed]: 'error',
};

interface ProjectMilestonesProps {
  projectId: string;
}

/**
 * The project's dated commitments.
 *
 * They sit beside the sprints because they answer the other half of "when": a sprint is how
 * work is organised, a milestone is what was promised. They are also the only part of a
 * project's plan a shared client link shows.
 */
export function ProjectMilestones({ projectId }: Readonly<ProjectMilestonesProps>) {
  const { formatDate } = useSettings();
  const confirm = useConfirm();
  const notify = useNotify();
  const [editing, setEditing] = useState<MilestoneFieldsFragment | null>(null);
  const [open, setOpen] = useState(false);
  const { data, refetch } = useProjectMilestonesQuery({
    variables: { projectId },
    skip: projectId === '',
    fetchPolicy: 'cache-and-network',
  });
  const [deleteMilestone] = useDeleteMilestoneMutation();

  const milestones = data?.projectMilestones ?? [];

  const openForm = (milestone: MilestoneFieldsFragment | null) => {
    setEditing(milestone);
    setOpen(true);
  };

  const remove = async (milestone: MilestoneFieldsFragment) => {
    const ok = await confirm({
      message: `Delete milestone "${milestone.name}"?`,
      confirmText: 'Delete',
    });
    if (!ok) {
      return;
    }
    try {
      await deleteMilestone({ variables: { id: milestone.id } });
      notify('Milestone deleted');
      await refetch();
    } catch (error) {
      notify(errorMessage(error, 'Could not delete the milestone'), 'error');
    }
  };

  if (open) {
    return (
      <CrudFormPage
        title={editing ? 'Edit milestone' : 'New milestone'}
        onBack={() => setOpen(false)}
      >
        <MilestoneForm
          projectId={projectId}
          initial={editing}
          onCancel={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            refetch().catch(() => undefined);
          }}
        />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <Flex direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Text size="label">Milestones ({milestones.length})</Text>
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<AddIcon />} onClick={() => openForm(null)}>
          New milestone
        </Button>
      </Flex>

      <Flex direction="column" spacing={1}>
        {milestones.map((milestone) => (
          <Flex
            key={milestone.id}
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ p: 1.25, borderRadius: `${CARD_RADIUS}px`, border: 1, borderColor: 'divider' }}
          >
            <Chip
              size="small"
              color={STATE_COLOR[milestone.state]}
              label={milestone.state.replaceAll('_', ' ')}
            />
            <Text size="sm" sx={{ flex: 1, minWidth: 0 }}>
              {milestone.name}
            </Text>
            <Text size="caption" color="text.secondary">
              {milestone.dueOn ? formatDate(milestone.dueOn) : 'No date'}
            </Text>
            <IconButton
              size="small"
              aria-label={`Edit ${milestone.name}`}
              onClick={() => openForm(milestone)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label={`Delete ${milestone.name}`}
              onClick={() => remove(milestone)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Flex>
        ))}
        {milestones.length === 0 ? (
          <Text size="sm" color="text.secondary">
            No milestones yet. Anything set here is what a shared client link shows.
          </Text>
        ) : null}
      </Flex>
    </Box>
  );
}
