import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Flex, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { FilterOp, useColdEmailDraftsQuery } from '@exyconn/shell/graphql/generated';
import { OPEN_DRAFT_PARAM } from './coldEmailPaths';
import { ColdEmailDraftsTable } from './ColdEmailDraftsTable';
import { DraftColdEmailButton } from './DraftColdEmailButton';
import { InlineColdEmailDraft } from './InlineColdEmailDraft';
import type { ColdEmailDraftTarget } from './forms/cold-email-draft';

/** How many of the record's drafts the tab lists, most recently changed first. */
const SHOWN = 50;

/**
 * A contact's or company's "Cold emails" tab: draft a new one with the AI, and a table of every
 * draft written for the record, newest first. A draft opens in place (its id rides in the URL, so a new draft
 * opens here too), where it is read, edited, given another version and sent.
 */
export function RecordColdEmails({ target }: Readonly<{ target: ColdEmailDraftTarget }>) {
  const t = useT();
  const { id } = target;
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
  const { data, loading, error, refetch } = useColdEmailDraftsQuery({
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
  const total = data?.coldEmailDrafts.totalCount ?? 0;

  const body =
    error && !data ? (
      <Alert severity="error">{errorMessage(error, t('Could not load the cold emails.'))}</Alert>
    ) : (
      <ColdEmailDraftsTable
        rows={rows}
        loading={loading && !data}
        onRefresh={() => refetch()}
        onOpen={(row) => openDraft(row.id === openId ? null : row.id)}
      />
    );

  return (
    <Box component="section" aria-labelledby={`cold-emails-${id}`} sx={panel}>
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 1 }}
      >
        <Text id={`cold-emails-${id}`} component="h2" size="label" weight="bold">
          {t('Cold emails')}
        </Text>
        <DraftColdEmailButton target={target} />
      </Flex>
      {openId && <InlineColdEmailDraft id={openId} onClose={() => openDraft(null)} />}
      {body}
      {total > rows.length && (
        <Text component="p" size="caption" color="text.secondary" sx={{ m: 0, mt: 1 }}>
          {t('Showing the latest {shown} of {total} cold emails.', {
            shown: rows.length,
            total,
          })}
        </Text>
      )}
    </Box>
  );
}
