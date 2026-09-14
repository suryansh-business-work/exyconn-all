import { useParams } from 'react-router-dom';
import { Alert, Box, Card, Chip, Flex, Typography, iconSize } from '@exyconn/shell/components/ui';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import { useT, type Interpolations } from '@exyconn/i18n';
import { formatWith } from '@exyconn/shell/utils/date';
import { useSharedProjectQuery } from '@exyconn/shell/graphql/generated';
import { DATE_FORMAT } from '../../status.constants';
import { SharedProjectFacts } from './SharedProjectFacts';
import { SharedProjectProgress } from './SharedProjectProgress';
import type { SharedProjectView } from './shared-project.types';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';

const dateOrDash = (value?: string | null) => (value ? formatWith(value, DATE_FORMAT) : '—');

/** The translator, as the module-scope helpers below receive it. */
type Translate = (source: string, values?: Interpolations) => string;

/** Hours against the agreed budget, or just the hours when no budget was set. */
function budgetFact(project: SharedProjectView, t: Translate): string {
  const tracked = `${project.trackedHours} h`;
  if (!project.budgetHours) {
    return tracked;
  }
  return t('{tracked} of {budget} h', { tracked, budget: project.budgetHours });
}

const factsOf = (project: SharedProjectView, t: Translate) => [
  { label: 'Status', value: project.status.replaceAll('_', ' ') },
  { label: 'Started', value: dateOrDash(project.startDate) },
  { label: 'Target end', value: dateOrDash(project.endDate) },
  { label: 'Hours tracked', value: budgetFact(project, t) },
];

/**
 * A client's read-only view of one project, opened from a share link and nothing else.
 *
 * It lives on the status site because that is the one app with no sign-in: the person
 * reading this has no portal account, and never will. Everything shown is what the server
 * chose to put in `sharedProject` — there is no second query here that could widen it.
 */
export function SharedProjectPage() {
  const t = useT();
  const { token = '' } = useParams();
  const { data, loading } = useSharedProjectQuery({
    variables: { token },
    skip: token === '',
    fetchPolicy: 'network-only',
  });

  if (loading) {
    return <LoadingState />;
  }

  const project = data?.sharedProject;

  if (!project) {
    return (
      <Card variant="outlined" sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
        <LockPersonIcon color="disabled" sx={{ fontSize: iconSize['5xl'] }} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            mt: 1,
          }}
        >
          {t('This link no longer works')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            mt: 1,
          }}
        >
          {t(
            'It has expired, been revoked, or was never valid. Ask whoever sent it for a new one.',
          )}
        </Typography>
      </Card>
    );
  }

  return (
    <Flex direction="column" spacing={3}>
      <Box>
        <Flex alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
            }}
          >
            {project.name}
          </Typography>
          {project.clientName ? (
            <Chip size="small" variant="outlined" label={project.clientName} />
          ) : null}
        </Flex>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
          }}
        >
          {t('Where this project has got to.')}
        </Typography>
      </Box>

      <Alert severity="info" icon={<LockPersonIcon />}>
        <strong>{t('Shared read-only view.')}</strong>{' '}
        {t(
          "This page shows progress only — no conversations, no screenshots and nobody's individual time. Anyone with the link can see it, so treat it as you would an emailed report.",
        )}
      </Alert>

      <SharedProjectFacts facts={factsOf(project, t)} />

      <SharedProjectProgress milestones={project.milestones} ticketCounts={project.ticketCounts} />
    </Flex>
  );
}
