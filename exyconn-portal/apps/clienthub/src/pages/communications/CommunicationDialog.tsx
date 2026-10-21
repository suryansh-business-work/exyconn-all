import { useT } from '@exyconn/i18n';
import { Stack, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { HubCommunicationRow } from './communications-grid';

interface CommunicationDialogProps {
  entry: HubCommunicationRow | null;
  onClose: () => void;
}

/** One log entry in full: when, who, the summary and every detail. */
export function CommunicationDialog({ entry, onClose }: Readonly<CommunicationDialogProps>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  return (
    <CrudDialog open={entry !== null} title={entry?.subject ?? ''} onClose={onClose}>
      {entry && (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <StatusChip value={entry.type} />
            <Text size="sm" color="text.secondary">
              {formatDateTime(entry.occurredAt)}
            </Text>
          </Stack>
          {entry.participants && (
            <Text size="sm">{t('With {people}', { people: entry.participants })}</Text>
          )}
          {entry.summary && (
            <Text component="p" sx={{ whiteSpace: 'pre-wrap' }}>
              {entry.summary}
            </Text>
          )}
          {entry.details && (
            <Text component="p" size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
              {entry.details}
            </Text>
          )}
          <Text size="caption" color="text.secondary">
            {t('Logged by {name}', { name: entry.loggedByName })}
          </Text>
        </Stack>
      )}
    </CrudDialog>
  );
}
