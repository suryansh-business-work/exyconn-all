import type { DetailTicket } from '@exyconn/shell/pages/ticket-desk';
import type { StatusTicket } from '../../../../src/pages/support/TicketStatusDialog';

/** The ticket drawer (thread, triage, replies) is the shell's; the stand-in shows what opened. */
export function DetailDialogStub({
  ticket,
  onClose,
  onChanged,
}: Readonly<{ ticket: DetailTicket | null; onClose: () => void; onChanged: () => void }>) {
  if (!ticket) {
    return null;
  }
  return (
    <div>
      <p>Detail of {ticket.subject}</p>
      <button type="button" onClick={onChanged}>
        Ticket changed
      </button>
      <button type="button" onClick={onClose}>
        Close detail
      </button>
    </div>
  );
}

/** The status drawer has its own tests; the stand-in shows which ticket and status it got. */
export function StatusDialogStub({
  ticket,
  onClose,
  onSaved,
}: Readonly<{ ticket: StatusTicket | null; onClose: () => void; onSaved: () => void }>) {
  if (!ticket) {
    return null;
  }
  return (
    <div>
      <p>
        Status of {ticket.subject} ({ticket.status})
      </p>
      <button type="button" onClick={onSaved}>
        Status saved
      </button>
      <button type="button" onClick={onClose}>
        Close status
      </button>
    </div>
  );
}

/** The customer-ticket form has its own tests; the stand-in only finishes or cancels. */
export function ClientTicketFormStub({
  onCancel,
  onDone,
}: Readonly<{ onCancel: () => void; onDone: () => void }>) {
  return (
    <div>
      <button type="button" onClick={onDone}>
        Ticket raised
      </button>
      <button type="button" onClick={onCancel}>
        Cancel ticket
      </button>
    </div>
  );
}
