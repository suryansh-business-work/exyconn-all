import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Skeleton, Stack, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useColdEmailDraftQuery,
  type ColdEmailDraftFieldsFragment,
  type ColdEmailVariantFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import {
  EditVariantDialog,
  RewriteDraftButton,
  VariantCard,
  useVariantActions,
} from '../../records/cold-email';
import { AnotherVariantForm } from './forms/another-variant';
import { DraftSummary } from './DraftSummary';

const logFailure = (what: string) => (error: unknown) => portalLogger.warn(`crm: ${what}`, error);

/** The draft's versions, newest first, with editing, deleting and sending each. */
function DraftVersions({ draft }: Readonly<{ draft: ColdEmailDraftFieldsFragment }>) {
  const t = useT();
  const actions = useVariantActions(draft);
  const [editing, setEditing] = useState<ColdEmailVariantFieldsFragment | null>(null);
  const close = () => setEditing(null);
  const numbered = draft.variants.map((variant, index) => ({ variant, number: index + 1 }));
  return (
    <Stack spacing={2}>
      <Text component="h2" size="label" weight="bold">
        {t('Versions ({count})', { count: draft.variants.length })}
      </Text>
      {numbered.toReversed().map(({ variant, number }) => (
        <VariantCard
          key={variant.id}
          variant={variant}
          number={number}
          busy={actions.deleting}
          onEdit={() => setEditing(variant)}
          onDelete={() => {
            actions.remove(variant).catch(logFailure('deleting a cold email version'));
          }}
          onUse={() => actions.use(variant)}
        />
      ))}
      <EditVariantDialog draftId={draft.id} variant={editing} onClose={close} />
    </Stack>
  );
}

/** CRM > Cold emails > one draft, at /cold-emails/:id. */
export function ColdEmailDraftPage() {
  const t = useT();
  const { id = '' } = useParams();
  const { data, error, refetch } = useColdEmailDraftQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const draft = data?.coldEmailDraft;
  usePageTitle(draft ? t('Cold email to {name}', { name: draft.recordName }) : t('Cold email'));

  if (error && !draft) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              refetch().catch(logFailure('reloading a cold email draft'));
            }}
          >
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the cold email.'))}
      </Alert>
    );
  }
  if (!draft) {
    return (
      <Stack spacing={2} aria-busy="true" aria-label={t('Loading the cold email')}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={240} />
      </Stack>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Cold email to {name}"
        titleValues={{ name: draft.recordName }}
        subtitle="Pick a version, edit it if you like, and send it from your mailbox"
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 2fr)' },
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
          <DraftSummary draft={draft} />
          <RewriteDraftButton draft={draft} />
          <Box component="section" aria-label={t('Generate another version')} sx={panel}>
            <AnotherVariantForm draftId={draft.id} tone={draft.tone} />
          </Box>
        </Stack>
        <DraftVersions draft={draft} />
      </Box>
    </Box>
  );
}
