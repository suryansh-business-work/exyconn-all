import { Link as RouterLink, useSearchParams } from 'react-router-dom';
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
import { COLD_EMAILS_PATH, OPEN_DRAFT_PARAM } from './coldEmailPaths';
import { InlineColdEmailDraft } from './InlineColdEmailDraft';

/** How many of the record's drafts the Overview tab lists; the section holds the rest. */
const SHOWN = 5;

/**
 * The record's cold email drafts on its Overview tab, newest first. A draft opens in place
 * (its id rides in the URL, so a new draft opens here too), where it is read, edited and sent.
 */
export function RecordColdEmails({ id }: Readonly<{ id: string }>) {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const openId = params.get(OPEN_DRAFT_PARAM);
  const openDraft = (draftId: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (draftId) {
          next.set(OPEN_DRAFT_PARAM, draftId);
        } else {
          next.delete(OPEN_DRAFT_PARAM);
        }
        return next;
      },
      { replace: true },
    );
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
          <ListItemButton
            key={row.id}
            selected={row.id === openId}
            aria-expanded={row.id === openId}
            onClick={() => openDraft(row.id === openId ? null : row.id)}
          >
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
      {openId && <InlineColdEmailDraft id={openId} onClose={() => openDraft(null)} />}
      {body}
    </Box>
  );
}
