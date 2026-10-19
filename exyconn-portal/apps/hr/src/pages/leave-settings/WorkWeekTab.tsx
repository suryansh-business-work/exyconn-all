import { Alert, Box } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { FormSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useWorkWeekQuery } from '@exyconn/shell/graphql/generated';
import { WorkWeekForm } from './forms/work-week';

/** HR → Leave Settings → Work week: the company's default working days. */
export function WorkWeekTab() {
  const { data, loading, error, refetch } = useWorkWeekQuery({ fetchPolicy: 'cache-and-network' });
  const workWeek = data?.workWeek;
  const reload = () => {
    refetch().catch((err: unknown) => portalLogger.warn('Could not reload the work week', err));
  };
  return (
    <Box sx={readingPanel}>
      {error && <Alert severity="error">{error.message}</Alert>}
      {loading && !workWeek && <FormSkeleton fields={1} surface={false} />}
      {workWeek && <WorkWeekForm initial={workWeek} onDone={reload} onCancel={reload} />}
    </Box>
  );
}
