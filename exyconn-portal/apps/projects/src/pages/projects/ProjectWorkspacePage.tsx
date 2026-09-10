import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Flex, Heading } from '@exyconn/shell/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import {
  SprintState,
  useGetProjectQuery,
  useProjectSprintsQuery,
} from '@exyconn/shell/graphql/generated';
import { ProjectBoardPage, SprintSelector } from './board';
import { ProjectTicketsPage } from './tickets';
import { ProjectDocsPage } from './docs';
import { ProjectTimeLogPage } from './time-log';
import { ProjectSprintsPage } from './sprints';
import { ProjectHealthPage } from './health';

/**
 * One project, six ways to look at it: how it is doing against what it promised, the
 * board, the same tickets as a list, the sprints they are committed to, the time logged
 * against them, and the project's documentation space. Which one is open lives in the URL, so a link to a board or a space is a link
 * somebody else can open.
 */
export function ProjectWorkspacePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data } = useGetProjectQuery({ variables: { id }, skip: id === '' });
  const { data: sprintData } = useProjectSprintsQuery({
    variables: { projectId: id },
    skip: id === '',
    fetchPolicy: 'cache-and-network',
  });
  const [sprintFilter, setSprintFilter] = useState('');

  const project = data?.getProject;
  const sprints = sprintData?.projectSprints ?? [];
  const activeSprintId = sprints.find((sprint) => sprint.state === SprintState.Active)?.id ?? '';

  // The board opens on whatever is running, which is what a team looks at all day. Once
  // somebody has chosen a different view it is theirs, so this only ever runs on the way in.
  useEffect(() => {
    if (activeSprintId) {
      setSprintFilter(activeSprintId);
    }
  }, [activeSprintId]);

  const tabs: TabberItem[] = [
    {
      slug: 'health',
      label: 'Health',
      icon: <MonitorHeartIcon />,
      content: <ProjectHealthPage projectId={id} />,
    },
    {
      slug: 'board',
      label: 'Board',
      icon: <ViewKanbanIcon />,
      content: <ProjectBoardPage projectId={id} sprintFilter={sprintFilter} />,
    },
    {
      slug: 'tickets',
      label: 'Tickets',
      icon: <FormatListBulletedIcon />,
      content: <ProjectTicketsPage projectId={id} />,
    },
    {
      slug: 'sprints',
      label: 'Sprints',
      icon: <DirectionsRunIcon />,
      content: <ProjectSprintsPage projectId={id} />,
    },
    {
      slug: 'time-log',
      label: 'Time log',
      icon: <ScheduleIcon />,
      content: (
        <ProjectTimeLogPage
          projectId={id}
          budgetHours={project?.budgetHours ?? null}
          budgetAmount={project?.budgetAmount ?? null}
        />
      ),
    },
    {
      slug: 'docs',
      label: 'Documents',
      icon: <MenuBookIcon />,
      content: <ProjectDocsPage projectId={id} />,
    },
  ];

  return (
    <Flex direction="column" sx={{ height: '100%', minHeight: 0 }}>
      <Flex direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} size="small">
          Projects
        </Button>
        <Heading level={5}>{project?.name ?? 'Project'}</Heading>
        {project?.key ? <Chip size="small" label={project.key} /> : null}
        {project?.status ? <Chip size="small" label={project.status} /> : null}
        {project?.clientName ? (
          <Chip size="small" variant="outlined" label={project.clientName} />
        ) : null}
        <Box sx={{ flex: 1 }} />
        <SprintSelector sprints={sprints} value={sprintFilter} onChange={setSprintFilter} />
      </Flex>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Tabber
          basePath={`/projects/${id}`}
          items={tabs}
          ariaLabel="Project views"
          sx={{ mb: 2 }}
        />
      </Box>
    </Flex>
  );
}
