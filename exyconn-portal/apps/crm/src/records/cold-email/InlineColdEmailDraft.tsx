import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Button,
  Chip,
  Flex,
  IconButton,
  Skeleton,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useColdEmailDraftQuery,
  type ColdEmailDraftFieldsFragment,
  type ColdEmailVariantFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { panel } from '@exyconn/shell/components/glass/glass';
import { ColdEmailBriefCard } from './ColdEmailBriefCard';
import { EditVariantDialog } from './EditVariantDialog';
import { RewriteDraftButton } from './RewriteDraftButton';
import { VariantCard } from './VariantCard';
import { VariantSwitcher } from './VariantSwitcher';
import { useVariantActions } from './useVariantActions';
import { AnotherVariantForm } from './forms/another-variant';

const logFailure = (what: string) => (error: unknown) => portalLogger.warn(`crm: ${what}`, error);

/** A loaded draft: pick a version, read it, edit, delete or send it, or rewrite the lot. */
function DraftBody({ draft }: Readonly<{ draft: ColdEmailDraftFieldsFragment }>) {
  const t = useT();
  const actions = useVariantActions(draft);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ColdEmailVariantFieldsFragment | null>(null);
  const index = Math.max(
    0,
    draft.variants.findIndex((variant) => variant.id === selectedId),
  );
  const selected = draft.variants[index];
  if (!selected) {
    return null;
  }
  return (
    <Stack spacing={1.5}>
      <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip size="small" label={t('To {email}', { email: draft.toEmail })} />
        <Chip
          size="small"
          variant="outlined"
          label={t('{count} versions', { count: draft.variants.length })}
        />
        {draft.goal && (
          <Text size="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {t('Offering: {goal}', { goal: draft.goal })}
          </Text>
        )}
      </Flex>
      <ColdEmailBriefCard draft={draft} />
      <VariantSwitcher
        variants={draft.variants}
        selectedId={selected.id}
        onSelect={setSelectedId}
      />
      <VariantCard
        variant={selected}
        number={index + 1}
        busy={actions.deleting}
        onEdit={() => setEditing(selected)}
        onDelete={() => {
          actions.remove(selected).catch(logFailure('deleting a cold email version'));
        }}
        onUse={() => actions.use(selected)}
      />
      <RewriteDraftButton draft={draft} onRewritten={setSelectedId} />
      <Box component="section" aria-label={t('Generate another version')} sx={panel}>
        <AnotherVariantForm draftId={draft.id} tone={draft.tone} onAdded={setSelectedId} />
      </Box>
      <EditVariantDialog draftId={draft.id} variant={editing} onClose={() => setEditing(null)} />
    </Stack>
  );
}

interface InlineColdEmailDraftProps {
  id: string;
  onClose: () => void;
}

/** One draft opened in place in a record's "Cold emails" section, with its loading and error states. */
export function InlineColdEmailDraft({ id, onClose }: Readonly<InlineColdEmailDraftProps>) {
  const t = useT();
  const { data, error, refetch } = useColdEmailDraftQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const draft = data?.coldEmailDraft;

  let body;
  if (error && !draft) {
    body = (
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
  } else if (draft) {
    body = <DraftBody key={draft.id} draft={draft} />;
  } else {
    body = <Skeleton variant="rounded" height={240} aria-label={t('Loading the cold email')} />;
  }

  return (
    <Stack spacing={1} component="section" aria-label={t('Open cold email')}>
      <Flex direction="row" justifyContent="flex-end">
        <IconButton size="small" onClick={onClose} aria-label={t('Close the cold email')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Flex>
      {body}
    </Stack>
  );
}
