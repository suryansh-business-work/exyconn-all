import { MenuItem, TextField } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useListSupportAgentsQuery,
  useAssignSupportTicketMutation,
} from '@exyconn/shell/graphql/generated';

interface TicketAssigneeProps {
  ticketId: string;
  assigneeId: string;
  onAssigned: () => void;
}

/**
 * Who owns the ticket. The empty option is deliberate: handing a ticket back to
 * the unassigned queue has to be as easy as taking it, or tickets get parked on
 * whoever touched them last.
 */
export function TicketAssignee({
  ticketId,
  assigneeId,
  onAssigned,
}: Readonly<TicketAssigneeProps>) {
  const notify = useNotify();
  const { data } = useListSupportAgentsQuery();
  const [assign, { loading }] = useAssignSupportTicketMutation();

  const agents = data?.listSupportAgents ?? [];

  const change = async (nextId: string) => {
    try {
      await assign({ variables: { id: ticketId, assigneeId: nextId } });
      const name = agents.find((a) => a.id === nextId)?.name;
      notify(name ? `Assigned to ${name}` : 'Back in the unassigned queue');
      onAssigned();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not assign', 'error');
    }
  };

  return (
    <TextField
      select
      fullWidth
      label="Assigned to"
      value={assigneeId}
      disabled={loading}
      onChange={(event) => change(event.target.value)}
    >
      <MenuItem value="">Unassigned</MenuItem>
      {agents.map((agent) => (
        <MenuItem key={agent.id} value={agent.id}>
          {agent.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
