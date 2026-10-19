import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Chip,
  Flex,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Text,
} from '@exyconn/shell/components/ui';
import type { MarketingSuppressionLookupQuery } from '@exyconn/shell/graphql/generated';

type Lookup = MarketingSuppressionLookupQuery['marketingSuppressionLookup'];

interface SuppressionLookupPanelProps {
  lookup: Lookup | null;
  loading: boolean;
}

/** Whether the address is already listed. */
function ExistingNotice({ lookup }: Readonly<{ lookup: Lookup }>) {
  const t = useT();
  if (!lookup.existing) {
    return null;
  }
  const message = lookup.existing.archivedAt
    ? '{email} is already suppressed (archived). It is still excluded from every campaign.'
    : '{email} is already on the suppression list.';
  return (
    <Alert severity="warning" role="alert">
      {t(message, { email: lookup.email })}
    </Alert>
  );
}

/**
 * What adding this address touches: an existing entry, and the CRM contacts and companies
 * that hold it — with their other addresses, which are listed but never suppressed with it.
 */
export function SuppressionLookupPanel({ lookup, loading }: Readonly<SuppressionLookupPanelProps>) {
  const t = useT();
  if (loading) {
    return <Skeleton variant="rounded" height={64} aria-label={t('Looking up the CRM…')} />;
  }
  if (!lookup) {
    return null;
  }
  const links = lookup.linkedRecords;
  return (
    <Flex direction="column" spacing={1} role="status" aria-live="polite">
      <ExistingNotice lookup={lookup} />
      {links.length === 0 ? (
        <Text size="sm" color="text.secondary">
          {t('No CRM contact or company uses this address.')}
        </Text>
      ) : (
        <Box>
          <Text size="sm" weight="medium">
            {t('Found in the CRM')}
          </Text>
          <List dense disablePadding>
            {links.map((link) => (
              <ListItem key={`${link.kind}-${link.id}`} disableGutters>
                <ListItemText
                  primary={
                    <Flex direction="row" gap={1} alignItems="center">
                      <Text size="sm">{link.name}</Text>
                      <Chip
                        size="small"
                        label={t(link.kind === 'COMPANY' ? 'Company' : 'Contact')}
                      />
                    </Flex>
                  }
                  secondary={
                    link.emails.filter((email) => email !== lookup.email).join(', ') ||
                    t('No other addresses')
                  }
                />
              </ListItem>
            ))}
          </List>
          <Text size="caption" color="text.secondary">
            {t('Only this address is suppressed. Other addresses on these records are not.')}
          </Text>
        </Box>
      )}
    </Flex>
  );
}
