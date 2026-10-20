import { useFormatters, useT } from '@exyconn/i18n';
import {
  Alert,
  Divider,
  Flex,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Text,
} from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useMarketingSuppressionHistoryQuery } from '@exyconn/shell/graphql/generated';
import type { PagedSuppressionRow } from './suppression-grid';

/** Every recorded change to the address, newest first — kept after removals too. */
function SuppressionHistory({ email }: Readonly<{ email: string }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const { data, loading, error } = useMarketingSuppressionHistoryQuery({
    variables: { email },
    fetchPolicy: 'network-only',
  });
  if (loading) {
    return <Skeleton variant="rounded" height={80} />;
  }
  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  const rows = data?.marketingSuppressionHistory ?? [];
  if (rows.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        {t('No recorded changes yet.')}
      </Text>
    );
  }
  return (
    <List dense disablePadding>
      {rows.map((row) => (
        <ListItem key={row.id} disableGutters>
          <ListItemText
            primary={row.summary}
            secondary={t('{who} · {when}', {
              who: row.actorName || t('System'),
              when: formatDateTime(row.createdAt),
            })}
          />
        </ListItem>
      ))}
    </List>
  );
}

/** One suppression in full: what, why, where from, who holds the address, and its history. */
export function SuppressionDetails({ row }: Readonly<{ row: PagedSuppressionRow }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const links = row.linkedRecords ?? [];
  return (
    <Flex direction="column" spacing={2}>
      <DetailFactGrid>
        <DetailFact label="Email">{row.email}</DetailFact>
        <DetailFact label="Reason">
          <StatusChip value={row.reason} />
        </DetailFact>
        <DetailFact label="Source">
          <StatusChip value={row.origin} />
        </DetailFact>
        <DetailFact label="Source detail">{row.source || '—'}</DetailFact>
        <DetailFact label="Scope">
          <StatusChip value={row.scope} />
        </DetailFact>
        <DetailFact label="Status">
          <StatusChip value={row.archivedAt ? 'ARCHIVED' : 'ACTIVE'} />
        </DetailFact>
        <DetailFact label="Added on">{formatDateTime(row.createdAt)}</DetailFact>
        <DetailFact label="Added by">{row.addedByName || '—'}</DetailFact>
      </DetailFactGrid>
      <DetailFact label="Internal note">{row.note || '—'}</DetailFact>
      {row.archivedAt && (
        <Alert severity="info">
          {t('Archived: hidden from the main list, still excluded from every campaign.')}
        </Alert>
      )}
      <Divider />
      <Text size="sm" weight="medium">
        {t('Linked CRM records')}
      </Text>
      {links.length === 0 ? (
        <Text size="sm" color="text.secondary">
          {t('No CRM contact or company uses this address.')}
        </Text>
      ) : (
        <List dense disablePadding>
          {links.map((link) => (
            <ListItem key={`${link.kind}-${link.id}`} disableGutters>
              <ListItemText
                primary={t('{name} ({kind})', {
                  name: link.name,
                  kind: t(link.kind === 'COMPANY' ? 'Company' : 'Contact'),
                })}
                secondary={t('Addresses: {emails}', { emails: link.emails.join(', ') })}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Divider />
      <Text size="sm" weight="medium">
        {t('History')}
      </Text>
      <SuppressionHistory email={row.email} />
    </Flex>
  );
}
