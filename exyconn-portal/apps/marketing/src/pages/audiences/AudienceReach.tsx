import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, Skeleton } from '@exyconn/shell/components/ui';
import { useAudienceResolutionCountsQuery } from '@exyconn/shell/graphql/generated';

interface AudienceReachProps {
  audienceId: string;
}

/**
 * How many unique addresses a send to this audience goes to, resolved now — not how many
 * CRM records matched. Shown wherever a campaign is sent or scheduled.
 */
export function AudienceReach({ audienceId }: Readonly<AudienceReachProps>) {
  const t = useT();
  const { formatNumber } = useFormatters();
  const { data, loading, error } = useAudienceResolutionCountsQuery({
    variables: { id: audienceId },
    fetchPolicy: 'network-only',
  });
  if (loading) {
    return <Skeleton variant="rounded" height={56} aria-label={t('Updating counts…')} />;
  }
  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  const counts = data?.audienceResolution.counts;
  if (!counts) {
    return null;
  }
  const records = counts.contacts + counts.companies + counts.clients;
  return (
    <Alert severity={counts.eligible > 0 ? 'info' : 'warning'} role="status">
      {t(
        'This send goes to {eligible} unique email address(es), from {records} matching record(s). {excluded} address(es) are excluded as unsubscribed, blocked, invalid or filtered, and {duplicates} duplicate(s) are sent once.',
        {
          eligible: formatNumber(counts.eligible),
          records: formatNumber(records),
          excluded: formatNumber(counts.suppressed + counts.invalid + counts.excluded),
          duplicates: formatNumber(counts.duplicates),
        },
      )}
    </Alert>
  );
}
