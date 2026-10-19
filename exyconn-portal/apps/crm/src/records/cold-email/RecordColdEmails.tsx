import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Flex,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Text,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  ColdEmailStatus,
  FilterOp,
  useColdEmailDraftsQuery,
} from '@exyconn/shell/graphql/generated';
import { COLD_EMAILS_PATH, coldEmailPath } from './coldEmailPaths';

/** How many of the record's drafts the Overview tab lists; the section holds the rest. */
const SHOWN = 5;

/** The record's cold email drafts on its Overview tab, newest first, each opening its page. */
export function RecordColdEmails({ id }: Readonly<{ id: string }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const { data, loading, error } = useColdEmailDraftsQuery({
    variables: {
      input: {
        page: 0,
        pageSize: SHOWN,
        filters: [{ field: 'recordId', op: FilterOp.Equals, value: id }],
      },
    },
    fetchPolicy: 'cache-and-network',
  });
  const rows = data?.coldEmailDrafts.rows ?? [];

  let body;
  if (error && !data) {
    body = (
      <Alert severity="error">{errorMessage(error, t('Could not load the cold emails.'))}</Alert>
    );
  } else if (loading && !data) {
    body = <Skeleton variant="rounded" height={56} aria-label={t('Loading the cold emails')} />;
  } else if (rows.length === 0) {
    body = (
      <Text component="p" size="sm" color="text.secondary" sx={{ m: 0 }}>
        {t('No cold emails yet. Use "Draft a cold email" to write one.')}
      </Text>
    );
  } else {
    body = (
      <List disablePadding>
        {rows.map((row) => (
          <ListItemButton key={row.id} component={RouterLink} to={coldEmailPath(row.id)}>
            <ListItemText
              primary={row.toEmail}
              secondary={t('{count} versions · {status} · updated {when}', {
                count: row.variantCount,
                status: row.status === ColdEmailStatus.Sent ? t('Sent') : t('Draft'),
                when: formatDateTime(row.updatedAt),
              })}
            />
          </ListItemButton>
        ))}
      </List>
    );
  }

  return (
    <Box component="section" aria-labelledby={`cold-emails-${id}`} sx={panel}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Text id={`cold-emails-${id}`} component="h2" size="label" weight="bold">
          {t('Cold emails')}
        </Text>
        <Link component={RouterLink} to={COLD_EMAILS_PATH} variant="body2">
          {t('All cold emails')}
        </Link>
      </Flex>
      {body}
    </Box>
  );
}
