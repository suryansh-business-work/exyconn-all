import { useT } from '@exyconn/i18n';
import { Box, Chip, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { ActionCommentForm, type CommentedActionItem } from '../forms/action-comment';
import type { ActionItemRow } from '../forms/action-item';
import { EvidenceQuotes } from '../lib/EvidenceQuotes';
import { ActionComments, ActionHistory } from './ActionActivity';

interface ActionDetailDrawerProps {
  row: ActionItemRow | null;
  onClose: () => void;
  /** The item came back with a new comment on it. */
  onChanged: (item: CommentedActionItem) => void;
}

/** One action item in full: why the AI suggested it, its comment thread and its history. */
export function ActionDetailDrawer({ row, onClose, onChanged }: Readonly<ActionDetailDrawerProps>) {
  const t = useT();
  return (
    <CrudDialog open={row !== null} title={t('Action item')} onClose={onClose}>
      {row && (
        <Box>
          <Text weight="semibold" sx={{ display: 'block' }}>
            {row.title}
          </Text>
          {row.description && (
            <Text size="sm" component="p" sx={{ whiteSpace: 'pre-line' }}>
              {row.description}
            </Text>
          )}
          <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ my: 1 }}>
            <StatusChip value={row.status} />
            <StatusChip value={row.priority} />
            {row.needsConfirmation && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={t('Needs confirmation')}
              />
            )}
            {row.overdue && <Chip size="small" color="error" label={t('Overdue')} />}
          </Flex>
          {row.aiGenerated && (
            <>
              <Heading level={3} sx={{ typography: 'subtitle2', mt: 2 }}>
                {t('Why the AI suggested it')}
              </Heading>
              <EvidenceQuotes evidence={row.evidence} />
            </>
          )}
          <ActionComments comments={row.comments} />
          <ActionCommentForm key={row.id} actionId={row.id} onDone={onChanged} />
          <ActionHistory history={row.history} />
        </Box>
      )}
    </CrudDialog>
  );
}
