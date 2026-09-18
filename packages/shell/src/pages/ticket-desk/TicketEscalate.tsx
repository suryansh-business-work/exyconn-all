import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { Button, Stack, Text } from '@/components/ui';
import { CrudDialog } from '@/components/data/CrudDialog';
import { useSettings } from '@/hooks/useSettings';
import { TicketEscalateForm } from './forms/ticket-escalate';

interface TicketEscalateProps {
  ticketId: string;
  escalationLevel: number;
  escalatedAt?: string | null;
  /** A finished ticket cannot be escalated; the server refuses it too. */
  closed: boolean;
  onEscalated: () => void;
}

/** The escalation state of a ticket, and the button that raises it one level. */
export function TicketEscalate({
  ticketId,
  escalationLevel,
  escalatedAt,
  closed,
  onEscalated,
}: Readonly<TicketEscalateProps>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
      <Button
        variant="outlined"
        color="warning"
        size="small"
        startIcon={<PriorityHighIcon />}
        disabled={closed}
        onClick={() => setOpen(true)}
      >
        {t('Escalate')}
      </Button>
      {escalationLevel > 0 && escalatedAt && (
        <Text size="sm" color="text.secondary">
          {t('Escalated to level {level} on {date}', {
            level: escalationLevel,
            date: formatDateTime(escalatedAt),
          })}
        </Text>
      )}
      <CrudDialog open={open} title={t('Escalate ticket')} onClose={() => setOpen(false)}>
        <TicketEscalateForm
          ticketId={ticketId}
          onCancel={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            onEscalated();
          }}
        />
      </CrudDialog>
    </Stack>
  );
}
