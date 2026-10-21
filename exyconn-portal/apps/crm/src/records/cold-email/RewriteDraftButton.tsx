import { useState } from 'react';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useT } from '@exyconn/i18n';
import { Button, Flex, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import type { ColdEmailDraftFieldsFragment } from '@exyconn/shell/graphql/generated';
import { DRAFT_VARIANT_COUNT } from './forms/cold-email-draft';
import { RewriteDraftForm } from './forms/rewrite-draft';

interface RewriteDraftButtonProps {
  draft: ColdEmailDraftFieldsFragment;
  /** Called with the first new version's id once they are written, e.g. to show it. */
  onRewritten?: (firstNewId: string) => void;
}

/**
 * "Rewrite based on latest data": fresh versions from the record as it is now. A full draft
 * cannot take more, so the button is off and says why.
 */
export function RewriteDraftButton({ draft, onRewritten }: Readonly<RewriteDraftButtonProps>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const room = draft.maxVariants - draft.variants.length;
  const count = Math.min(DRAFT_VARIANT_COUNT, room);
  return (
    <Flex direction="column" spacing={0.5} alignItems="flex-start">
      <Button
        size="small"
        variant="outlined"
        startIcon={<AutorenewIcon />}
        onClick={() => setOpen(true)}
        disabled={room <= 0}
      >
        {t('Rewrite based on latest data')}
      </Button>
      {room <= 0 && (
        <Text component="p" size="caption" color="text.secondary" sx={{ m: 0 }}>
          {t('This draft holds {max} versions, the most it can. Delete some to rewrite it.', {
            max: draft.maxVariants,
          })}
        </Text>
      )}
      <CrudDialog open={open} title={t('Rewrite based on latest data')} onClose={close}>
        {open && (
          <RewriteDraftForm
            draftId={draft.id}
            count={count}
            onDone={(saved) => {
              close();
              const firstNew = saved.variants[draft.variants.length];
              if (firstNew) {
                onRewritten?.(firstNew.id);
              }
            }}
            onCancel={close}
          />
        )}
      </CrudDialog>
    </Flex>
  );
}
