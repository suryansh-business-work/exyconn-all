import { useFormContext, useWatch } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { RhfSelect } from '@exyconn/shell/components/form/rhf';
import {
  useAudienceResolutionCountsQuery,
  useListAudienceListsQuery,
} from '@exyconn/shell/graphql/generated';
import { AudienceCountsGrid } from '../../../../audiences/AudienceCountsGrid';
import type { CampaignStudioValues } from '../campaign.types';

/** The audience's live counts for this campaign, its preference category applied. */
function AudienceCounts({
  audienceId,
  categoryId,
}: Readonly<{ audienceId: string; categoryId: string }>) {
  const t = useT();
  const { formatNumber, formatDateTime } = useFormatters();
  const { data, loading, error, refetch } = useAudienceResolutionCountsQuery({
    variables: { id: audienceId, categoryId: categoryId || null },
    fetchPolicy: 'network-only',
  });
  if (error) {
    return (
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
    );
  }
  const resolution = data?.audienceResolution;
  return (
    <Flex direction="column" spacing={1.5}>
      <AudienceCountsGrid counts={resolution?.counts ?? null} stale={loading} />
      {resolution && (
        <Alert severity={resolution.counts.eligible > 0 ? 'info' : 'warning'} role="status">
          {t(
            '{count} unique email address(es) are eligible right now, after duplicates, unsubscribes, blocks and category opt-outs. Counted {time}.',
            {
              count: formatNumber(resolution.counts.eligible),
              time: formatDateTime(resolution.resolvedAt),
            },
          )}
        </Alert>
      )}
    </Flex>
  );
}

/** Who receives the campaign: a saved Smart Audience, with what it reaches today. */
export function AudienceStep() {
  const t = useT();
  const { control } = useFormContext<CampaignStudioValues>();
  const [audienceId, categoryId] = useWatch({
    control,
    name: ['scheduledAudienceListId', 'preferenceCategoryId'],
  });
  const { data, loading } = useListAudienceListsQuery();
  const options = (data?.listAudienceLists ?? []).map((audience) => ({
    value: audience.id,
    label: `${audience.name} · ${t(audience.updateMode === 'DYNAMIC' ? 'Live dynamic' : 'Fixed')}`,
  }));
  return (
    <Flex direction="column" spacing={2}>
      <Text size="sm" color="text.secondary">
        {t(
          'Audiences choose contacts, companies or both, and which of their addresses to use. Suppressed and opted-out addresses are removed again at the moment of sending.',
        )}
      </Text>
      <RhfSelect
        name="scheduledAudienceListId"
        label="Audience"
        options={options}
        helperText={
          !loading && options.length === 0 ? 'No audiences yet — create one first.' : undefined
        }
      />
      <Button
        component={RouterLink}
        to="/marketing/audiences"
        variant="text"
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Create or edit audiences')}
      </Button>
      {audienceId && <AudienceCounts audienceId={audienceId} categoryId={categoryId} />}
    </Flex>
  );
}
