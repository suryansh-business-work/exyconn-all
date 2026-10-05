import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Button, Card, Grid, Stack, Heading, Text } from '@exyconn/shell/components/ui';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import {
  ProjectStatus,
  useClientHubMeQuery,
  useClientHubProjectsQuery,
  useClientHubRemindersQuery,
} from '@exyconn/shell/graphql/generated';
import { RemindersPanel } from './RemindersPanel';
import { PATHS } from '../../paths';

const QUICK_LINKS = [
  { to: PATHS.invoices, label: 'Invoices', text: 'Download, email or pay any invoice' },
  { to: PATHS.transactions, label: 'Transactions', text: 'Every payment we have received' },
  { to: PATHS.support, label: 'Support', text: 'Raise a ticket or follow a reply' },
] as const;

/** The client hub's first screen: what needs paying, how the projects stand, where to go next. */
export function DashboardPage() {
  const t = useT();
  const { data: me } = useClientHubMeQuery({ fetchPolicy: 'cache-first' });
  const { data: remindersData, loading } = useClientHubRemindersQuery();
  const { data: projectsData } = useClientHubProjectsQuery();
  const firstName = me?.clientHubMe.name.split(' ')[0] ?? '';
  const activeProjects = (projectsData?.clientHubProjects ?? []).filter(
    (project) => project.status === ProjectStatus.Active,
  ).length;

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Heading level={4}>{t('Welcome back, {name}', { name: firstName })}</Heading>
        <Text color="text.secondary">
          {t('{active} active projects', { active: activeProjects })}
        </Text>
      </Stack>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          {loading && !remindersData ? (
            <LoadingState />
          ) : (
            <RemindersPanel reminders={remindersData?.clientHubReminders ?? []} />
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2}>
            {QUICK_LINKS.map((link) => (
              <Card key={link.to} sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Stack>
                    <Text weight="semibold">{t(link.label)}</Text>
                    <Text size="sm" color="text.secondary">
                      {t(link.text)}
                    </Text>
                  </Stack>
                  <Button component={RouterLink} to={link.to} size="small">
                    {t('Open')}
                  </Button>
                </Stack>
              </Card>
            ))}
            <Button component={RouterLink} to={PATHS.projects} variant="outlined">
              {t('See your projects')}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
