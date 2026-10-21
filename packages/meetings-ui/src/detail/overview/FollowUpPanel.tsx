import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Box,
  Heading,
  Link,
  List,
  ListItem,
  ListItemText,
  Text,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { useMaFollowUpQuery } from '@exyconn/shell/graphql/generated';
import { LoadError } from '../../lib/LoadError';
import { FollowUpList } from './FollowUpList';

/**
 * What this call should remember from the previous one in its series: the summary, actions
 * still open, done or overdue, and blockers nobody resolved.
 */
interface FollowUpPanelProps {
  meetingId: string;
  /** The meetings list, so the previous meeting can be linked to. */
  listPath: string;
}

export function FollowUpPanel({ meetingId, listPath }: Readonly<FollowUpPanelProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const { data, error, refetch } = useMaFollowUpQuery({ variables: { meetingId } });
  const followUp = data?.maFollowUp;

  let body;
  if (error) {
    body = <LoadError message={error.message} onRetry={() => refetch()} />;
  } else if (!followUp) {
    body = <PanelSkeleton />;
  } else if (followUp.previousMeeting) {
    const previous = followUp.previousMeeting;
    body = (
      <>
        <Text size="sm" color="text.secondary">
          {t('Follows')}{' '}
          <Link component={RouterLink} to={`${listPath}/${previous.id}`}>
            {previous.title}
          </Link>{' '}
          · {formatDateTime(previous.startedAt)}
        </Text>
        {followUp.previousSummary && <Text sx={{ mt: 1 }}>{followUp.previousSummary}</Text>}
        <FollowUpList title="Overdue actions" actions={followUp.overdueActions} />
        <FollowUpList title="Pending actions" actions={followUp.pendingActions} />
        <FollowUpList title="Completed actions" actions={followUp.completedActions} />
        {followUp.unresolvedBlockers.length > 0 && (
          <>
            <Text size="sm" weight="semibold" sx={{ mt: 1.5, display: 'block' }}>
              {t('Unresolved blockers')}
            </Text>
            <List dense disablePadding>
              {followUp.unresolvedBlockers.map((blocker) => (
                <ListItem key={blocker} disableGutters>
                  <ListItemText primary={blocker} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </>
    );
  } else {
    body = (
      <Text size="sm" color="text.secondary">
        {t('This is the first meeting in its series, so there is nothing to follow up yet.')}
      </Text>
    );
  }

  return (
    <Box sx={panel}>
      <Heading level={2} sx={{ typography: 'h6', mb: 1 }}>
        {t('Follow-up from the previous meeting')}
      </Heading>
      {body}
    </Box>
  );
}
