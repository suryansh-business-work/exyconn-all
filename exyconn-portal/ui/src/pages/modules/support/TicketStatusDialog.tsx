import { useEffect, useState } from 'react';
import { Button, Flex, Text, TextField, MenuItem } from '@/components/ui';
import { CrudDialog } from '@/components/data/CrudDialog';
import { enumOptions } from '@/utils/enumOptions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { SupportStatus, useSetSupportTicketStatusMutation } from '@/graphql/generated';

const STATUS_OPTIONS = enumOptions(Object.values(SupportStatus));

export interface StatusTicket {
  id: string;
  subject: string;
  status: string;
}

interface TicketStatusDialogProps {
  ticket: StatusTicket | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Small drawer to move a support ticket to a new lifecycle status. */
export function TicketStatusDialog({ ticket, onClose, onSaved }: TicketStatusDialogProps) {
  const notify = useNotify();
  const [setStatus, { loading }] = useSetSupportTicketStatusMutation();
  const [status, setStatusValue] = useState('');

  useEffect(() => {
    if (ticket) setStatusValue(ticket.status);
  }, [ticket]);

  const save = async () => {
    if (!ticket) return;
    try {
      await setStatus({ variables: { id: ticket.id, status: status as SupportStatus } });
      notify('Ticket status updated');
      onSaved();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <CrudDialog open={Boolean(ticket)} title="Update status" onClose={onClose}>
      <Flex direction="column" spacing={2.5}>
        <Text size="sm" color="text.secondary">
          {ticket?.subject}
        </Text>
        <TextField
          select
          fullWidth
          label="Status"
          value={status}
          onChange={(e) => setStatusValue(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
        <Flex direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
          <Button type="button" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={save} disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </Flex>
      </Flex>
    </CrudDialog>
  );
}
