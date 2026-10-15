import { useT } from '@exyconn/i18n';
import { Stack, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { TicketShareForm, type TicketShareRecipient } from './forms/ticket-share';

interface ShareTicketDialogProps {
  open: boolean;
  taskId: string;
  ticketKey: string;
  recipients: TicketShareRecipient[];
  onClose: () => void;
}

/** Sends the ticket to colleagues. Reaching people outside the company is what Public is for. */
export function ShareTicketDialog({
  open,
  taskId,
  ticketKey,
  recipients,
  onClose,
}: Readonly<ShareTicketDialogProps>) {
  const t = useT();
  return (
    <CrudDialog open={open} title={t('Share {key}', { key: ticketKey })} onClose={onClose}>
      <Stack spacing={2}>
        <Text size="sm" color="text.secondary">
          {t(
            'Each person gets a notification linking to this ticket. To show it to somebody without a Projects sign-in, make the ticket Public and send them its public link.',
          )}
        </Text>
        {open ? (
          <TicketShareForm
            taskId={taskId}
            recipients={recipients}
            onShared={onClose}
            onCancel={onClose}
          />
        ) : null}
      </Stack>
    </CrudDialog>
  );
}
