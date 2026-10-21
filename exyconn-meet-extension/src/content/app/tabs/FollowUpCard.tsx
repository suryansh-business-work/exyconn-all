import { Alert, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { Logger } from '@exyconn/logger';
import { usePanelQuery } from '../usePanelQuery';

/** "Three action items from the previous meeting are still pending" — when there are any. */
export function FollowUpCard({ enabled, logger }: Readonly<{ enabled: boolean; logger: Logger }>) {
  const t = useT();
  const { data } = usePanelQuery({ op: 'followUp' }, enabled, null, logger);
  if (data?.previousMeeting == null) {
    return null;
  }
  const pending = data.pendingActions.length;
  const overdue = data.overdueActions.length;
  return (
    <Alert severity={pending > 0 ? 'warning' : 'info'}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t('Follow-up from "{title}"', { title: data.previousMeeting.title })}
      </Typography>
      <Typography variant="body2">
        {pending === 0
          ? t('Every action item from the previous meeting is done.')
          : t(
              '{count} action items from the previous meeting are still pending ({overdue} overdue).',
              { count: pending, overdue },
            )}
      </Typography>
      {data.unresolvedBlockers.length > 0 ? (
        <Typography variant="body2">
          {t('{count} blockers are still unresolved.', { count: data.unresolvedBlockers.length })}
        </Typography>
      ) : null}
    </Alert>
  );
}
