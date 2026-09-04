import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Flex, Heading } from '@exyconn/shell/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { useGetProjectQuery } from '@exyconn/shell/graphql/generated';
import { ProjectBoardPage } from './board';
import { ProjectTicketsPage } from './tickets';
import { ProjectDocsPage } from './docs';

/**
 * One project, three ways to work on it: the board, the same tickets as a list, and the
 * project's documentation space. Which one is open lives in the URL, so a link to a board
 * or a space is a link somebody else can open.
 */
export function ProjectWorkspacePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data } = useGetProjectQuery({ variables: { id }, skip: id === '' });

  const project = data?.getProject;
  const tabs: TabberItem[] = [
    {
      slug: 'board',
      label: 'Board',
      icon: <ViewKanbanIcon />,
      content: <ProjectBoardPage projectId={id} />,
    },
    {
      slug: 'tickets',
      label: 'Tickets',
      icon: <FormatListBulletedIcon />,
      content: <ProjectTicketsPage projectId={id} />,
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
