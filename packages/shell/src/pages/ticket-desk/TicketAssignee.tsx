import { useT } from '@exyconn/i18n';
import { MenuItem, TextField } from '@/components/ui';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  type SupportCategory,
  useListSupportAgentsQuery,
  useAssignSupportTicketMutation,
} from '@/graphql/generated';

interface TicketAssigneeProps {
  ticketId: string;
  assigneeId: string;
  /** IT tickets go to IT staff, everything else to the support desk. */
  category: string;
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
  category,
  onAssigned,
}: Readonly<TicketAssigneeProps>) {
  const notify = useNotify();
  const t = useT();
  const { data } = useListSupportAgentsQuery({
    variables: { category: category as SupportCategory },
  });
  const [assign, { loading }] = useAssignSupportTicketMutation();

  const agents = data?.listSupportAgents ?? [];

  const change = async (nextId: string) => {
    try {
      await assign({ variables: { id: ticketId, assigneeId: nextId } });
      const name = agents.find((a) => a.id === nextId)?.name;
      if (name) {
        notify('Assigned to {name}', 'success', { name });
      } else {
        notify('Back in the unassigned queue');
      }
      onAssigned();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not assign', 'error');
    }
  };

  return (
    <TextField
      select
      fullWidth
      label={t('Assigned to')}
      value={assigneeId}
      disabled={loading}
      onChange={(event) => change(event.target.value)}
    >
      <MenuItem value="">{t('Unassigned')}</MenuItem>
      {agents.map((agent) => (
        <MenuItem key={agent.id} value={agent.id}>
          {agent.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
