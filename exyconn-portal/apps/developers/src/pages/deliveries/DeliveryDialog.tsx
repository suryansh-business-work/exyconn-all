import { useT } from '@exyconn/i18n';
import { Box, Stack, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DetailFact } from '@exyconn/shell/components/data/DetailFact';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { DeliveryRow } from './deliveries-grid';

/** The body as it was signed, pretty-printed when it parses, as sent when it does not. */
function pretty(payload: string): string {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

interface DeliveryDialogProps {
  delivery: DeliveryRow | null;
  onClose: () => void;
}

/** One delivery in full: the exact body that was signed and sent, and what the receiver said. */
export function DeliveryDialog({ delivery, onClose }: Readonly<DeliveryDialogProps>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  return (
    <CrudDialog open={delivery !== null} title={delivery?.event ?? ''} onClose={onClose}>
      {delivery && (
        <Stack spacing={1.5}>
          <DetailFact label="Endpoint">{delivery.webhookName || delivery.webhookId}</DetailFact>
          <DetailFact label="Status">{delivery.status}</DetailFact>
          <DetailFact label="Attempts">{delivery.attempts}</DetailFact>
          <DetailFact label="Next attempt">{formatDateTime(delivery.nextAttemptAt)}</DetailFact>
          {delivery.error ? <DetailFact label="Error">{delivery.error}</DetailFact> : null}
          <Text size="sm" weight="bold">
            {t('Payload')}
          </Text>
          <Box
            component="pre"
            role="region"
            tabIndex={0}
            aria-label={t('Payload')}
            sx={{
              m: 0,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              fontFamily: 'monospace',
              fontSize: 12,
              overflowX: 'auto',
              whiteSpace: 'pre',
            }}
          >
            {pretty(delivery.payload)}
          </Box>
        </Stack>
      )}
    </CrudDialog>
  );
}
