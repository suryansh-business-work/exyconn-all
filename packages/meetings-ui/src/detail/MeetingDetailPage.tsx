import { useParams } from 'react-router-dom';
import { Box } from '@exyconn/shell/components/ui';
import { DetailSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { useMaMeetingQuery } from '@exyconn/shell/graphql/generated';
import { LoadError } from '../lib/LoadError';
import { meetingPaths, type MeetingPageProps } from '../lib/scope';
import { MeetingHeader } from './MeetingHeader';
import { MeetingTabs } from './MeetingTabs';

/** One meeting: its facts, transcript, participants, notes, actions, decisions and email. */
export function MeetingDetailPage({ scope, basePath }: Readonly<MeetingPageProps>) {
  const { id = '' } = useParams();
  const paths = meetingPaths(basePath);
  const { data, loading, error, refetch } = useMaMeetingQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const meeting = data?.maMeeting;

  if (error && !meeting) {
    return <LoadError message={error.message} onRetry={() => refetch()} />;
  }
  if (!meeting) {
    return <DetailSkeleton tabs aside={false} />;
  }
  return (
    <Box aria-busy={loading}>
      <MeetingHeader meeting={meeting} backTo={paths.list} />
      <MeetingTabs meeting={meeting} scope={scope} listPath={paths.list} />
    </Box>
  );
}
