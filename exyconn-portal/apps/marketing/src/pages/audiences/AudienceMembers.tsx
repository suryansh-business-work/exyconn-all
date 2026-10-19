import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { useAudienceResolutionCountsQuery } from '@exyconn/shell/graphql/generated';
import { AudienceCountsGrid } from './AudienceCountsGrid';
import { AudienceRecipientsGrid } from './AudienceRecipientsGrid';

interface AudienceMembersProps {
  audienceId: string;
  audienceName: string;
}

/**
 * Who a saved audience reaches right now — the same question the send asks, so the figure
 * on screen is the one that will be mailed. A fixed audience shows its snapshot re-checked.
 */
export function AudienceMembers({ audienceId, audienceName }: Readonly<AudienceMembersProps>) {
  const t = useT();
  const { formatNumber, formatDateTime } = useFormatters();
  const { data, loading, error, refetch } = useAudienceResolutionCountsQuery({
    variables: { id: audienceId },
    fetchPolicy: 'network-only',
  });
  const resolution = data?.audienceResolution;
  return (
    <Flex direction="column" spacing={2}>
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              {t('Retry')}
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}
      <Text size="sm" color="text.secondary" role="status">
        {resolution
          ? t('“{name}” reaches {count} unique address(es). Last refreshed {time}.', {
              name: audienceName,
              count: formatNumber(resolution.counts.eligible),
              time: formatDateTime(resolution.resolvedAt),
            })
          : t('Updating counts…')}
      </Text>
      <AudienceCountsGrid counts={resolution?.counts ?? null} stale={loading} />
      <AudienceRecipientsGrid target={{ audienceId }} />
    </Flex>
  );
}
