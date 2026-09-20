import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Flex, LinearProgress, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useBackgroundJobsQuery,
  useRunBackgroundJobMutation,
  type BackgroundJobsQuery,
} from '@exyconn/shell/graphql/generated';
import { JobRow } from './JobRow';

export type BackgroundJob = BackgroundJobsQuery['backgroundJobs'][number];

/**
 * Tech › Jobs: the loops this server runs, and a way to make one take a pass now.
 *
 * Eleven loops carry the parts of this portal nobody is watching — the payslips, the chases,
 * the reminders, the mailbox, the monitors. Their heartbeats were on the health screen and
 * there was no way to act on one: a digest that did not go out meant waiting an hour to find
 * out whether it ever would.
 *
 * "Never since restart" is the honest answer for a loop that has not ticked in THIS process:
 * the heartbeats are in memory on purpose, because a stored timestamp survives the crash
 * that stopped the loop and would report a dead scheduler as healthy.
 */
export function JobsPage() {
  const t = useT();
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const { data, loading, error, refetch } = useBackgroundJobsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [run, { loading: running }] = useRunBackgroundJobMutation();
  const jobs = data?.backgroundJobs ?? [];

  const runNow = async (job: BackgroundJob) => {
    try {
      await run({ variables: { key: job.key } });
      await refetch();
      notify(t('{label} has taken a pass.', { label: job.label }), 'success');
    } catch (err) {
      notify(errorMessage(err, t('That job could not be run.')), 'error');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Background jobs"
        subtitle="What runs on its own, when it last ran, and how to make it run now"
      >
        <Button variant="outlined" onClick={() => refetch()} disabled={loading}>
          {t('Refresh')}
        </Button>
      </PageHeader>

      {loading && jobs.length === 0 && <LinearProgress sx={{ mb: 1.5 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {errorMessage(error, t('The job list could not be read.'))}
        </Alert>
      )}

      <Box sx={panel}>
        <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
          {t(
            'Running a job by hand is the same pass its timer takes, so pressing it twice is safe.',
          )}
        </Text>
        <Flex direction="column">
          {jobs.map((job) => (
            <JobRow
              key={job.key}
              job={job}
              busy={running}
              formatDateTime={formatDateTime}
              onRun={() => runNow(job)}
            />
          ))}
        </Flex>
      </Box>
    </Box>
  );
}
