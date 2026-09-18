import { CrudDialog } from '@/components/data/CrudDialog';
import { TicketDetailBody, type DetailTicket } from './TicketDetailBody';

export type { DetailTicket };

interface TicketDetailDialogProps {
  ticket: DetailTicket | null;
  onClose: () => void;
  onChanged: () => void;
  topics?: readonly string[];
}

/** The detail view in a drawer, opened from a row in the console grid. */
export function TicketDetailDialog({
  ticket,
  onClose,
  onChanged,
  topics,
}: Readonly<TicketDetailDialogProps>) {
  if (!ticket) {
    return null;
  }

  return (
    <CrudDialog open title={ticket.subject} onClose={onClose}>
      <TicketDetailBody ticket={ticket} onChanged={onChanged} onCancel={onClose} topics={topics} />
    </CrudDialog>
  );
}
