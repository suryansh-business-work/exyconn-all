import type { TaskInput } from '@exyconn/shell/graphql/generated';
import type {
  TicketAssigneeOption,
  TicketRow,
} from '../../../../../src/pages/projects/forms/ticket';

interface TicketFormStubProps {
  initial: TicketRow | null;
  assignees: TicketAssigneeOption[];
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel: () => void;
}

/** Who the stand-in form was offered as assignees, as one line. */
const assigneeLine = (assignees: TicketAssigneeOption[]) =>
  assignees.length === 0 ? 'nobody' : assignees.map((option) => option.label).join(', ');

/**
 * Stands in for the ticket form inside the dialog test (the form has its own tests): names
 * the ticket and the assignees it was given, and exposes submit and cancel as buttons.
 */
export function TicketFormStub({
  initial,
  assignees,
  onSubmit,
  onCancel,
}: Readonly<TicketFormStubProps>) {
  const edited: TaskInput = { title: 'Edited' };
  return (
    <div>
      <p>{`Form for ${initial?.key ?? 'new'} with ${assigneeLine(assignees)}`}</p>
      <button type="button" onClick={() => onSubmit(edited)}>
        Save ticket
      </button>
      <button type="button" onClick={onCancel}>
        Cancel ticket
      </button>
    </div>
  );
}
