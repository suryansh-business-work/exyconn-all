import { useState } from 'react';
import { Box, Button, Divider, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import AddIcon from '@mui/icons-material/Add';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useProjectBoardQuery } from '@exyconn/shell/graphql/generated';
import { SprintForm } from '../forms/sprint';
import { SprintCard } from './SprintCard';
import { ProjectMilestones } from './ProjectMilestones';
import { doneColumnIdOf, sprintProgress } from './sprint-progress';
import { useProjectSprints } from './useProjectSprints';

interface ProjectSprintsPageProps {
  projectId: string;
}

/**
 * The project's sprints, planned first. Progress is read from the board itself — the same
 * tickets in the same columns the board draws — so the bar and the board can never disagree.
 */
export function ProjectSprintsPage({ projectId }: Readonly<ProjectSprintsPageProps>) {
  const { formatDate } = useSettings();
  const [creating, setCreating] = useState(false);
  const { data, refetch } = useProjectBoardQuery({
    variables: { projectId },
    skip: projectId === '',
    fetchPolicy: 'cache-and-network',
  });
  const sprintsApi = useProjectSprints(projectId, () => {
    refetch().catch(() => undefined);
  });

  const board = data?.projectBoard;
  const doneColumnId = doneColumnIdOf(board?.columns ?? []);
  const tasks = board?.tasks ?? [];

  const windowOf = (startsOn?: string | null, endsOn?: string | null) => {
    if (!startsOn && !endsOn) {
      return 'No dates set';
    }
    const from = startsOn ? formatDate(startsOn) : '—';
    const to = endsOn ? formatDate(endsOn) : '—';
    return `${from} → ${to}`;
  };

  if (creating) {
    return (
      <CrudFormPage title="New sprint" onBack={() => setCreating(false)}>
        <SprintForm
          projectId={projectId}
          initial={null}
          onCancel={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            sprintsApi.reload().catch(() => undefined);
          }}
        />
      </CrudFormPage>
    );
  }

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Flex direction="row" alignItems="center" spacing={1}>
        <Text size="label">Sprints ({sprintsApi.sprints.length})</Text>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreating(true)}
        >
          New sprint
        </Button>
      </Flex>

      {sprintsApi.sprints.map((sprint) => (
        <SprintCard
          key={sprint.id}
          sprint={sprint}
          progress={sprintProgress(tasks, sprint.id, doneColumnId)}
          window={windowOf(sprint.startsOn, sprint.endsOn)}
          onStart={sprintsApi.start}
          onComplete={sprintsApi.complete}
          onDelete={sprintsApi.remove}
        />
      ))}

      {sprintsApi.sprints.length === 0 && !sprintsApi.loading ? (
        <Text size="sm" color="text.secondary">
          No sprints yet. Plan one and tickets can be committed to it from the board.
        </Text>
      ) : null}

      <Divider sx={{ my: 1 }} />

      <ProjectMilestones projectId={projectId} />
    </Stack>
  );
}
