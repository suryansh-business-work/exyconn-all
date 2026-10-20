import { useT } from '@exyconn/i18n';
import { Alert, Box, Chip, Flex, Text } from '@exyconn/shell/components/ui';
import { ListSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useOrganizationHistoryQuery,
  type OrganizationHistoryQuery,
} from '@exyconn/shell/graphql/generated';

type Entry = OrganizationHistoryQuery['organizationHistory'][number];

/** "currency: INR → USD" lines from an audit row's JSON changes. */
function changeLines(changes: string): string[] {
  if (!changes) {
    return [];
  }
  const parsed = JSON.parse(changes) as Record<string, { from: unknown; to: unknown }>;
  return Object.entries(parsed).map(
    ([field, change]) =>
      `${field}: ${JSON.stringify(change.from ?? '')} → ${JSON.stringify(change.to ?? '')}`,
  );
}

function HistoryRow({ entry, when }: Readonly<{ entry: Entry; when: string }>) {
  return (
    <Box component="li" sx={{ py: 1.5, borderTop: 1, borderColor: 'divider', listStyle: 'none' }}>
      <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip size="small" variant="outlined" label={entry.action} />
        <Text size="sm" weight="medium">
          {entry.summary}
        </Text>
      </Flex>
      {changeLines(entry.changes).map((line) => (
        <Text
          key={line}
          size="caption"
          color="text.secondary"
          sx={{ display: 'block', overflowWrap: 'anywhere' }}
        >
          {line}
        </Text>
      ))}
      <Text size="caption" color="text.secondary">
        {when} · {entry.actorName || entry.actorEmail}
      </Text>
    </Box>
  );
}

/**
 * Everything done to one organization, newest first: when it was created and by whom, every
 * edit with what changed, suspensions, and each person invited or appointed.
 */
export function OrganizationHistory({ organizationId }: Readonly<{ organizationId: string }>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  const { data, loading, error } = useOrganizationHistoryQuery({
    variables: { id: organizationId },
    fetchPolicy: 'cache-and-network',
  });
  const entries = data?.organizationHistory ?? [];
  if (error && !data) {
    return (
      <Alert severity="error">{errorMessage(error, t('The history could not be loaded.'))}</Alert>
    );
  }
  if (loading && !data) {
    return <ListSkeleton toolbar={false} rows={4} columns={2} label="Loading the history" />;
  }
  if (entries.length === 0) {
    return (
      <Text color="text.secondary">
        {t('Nothing has been recorded for this organization yet.')}
      </Text>
    );
  }
  return (
    <Box component="ol" sx={{ p: 0, m: 0 }}>
      {entries.map((entry) => (
        <HistoryRow key={entry.id} entry={entry} when={formatDateTime(entry.createdAt)} />
      ))}
    </Box>
  );
}
