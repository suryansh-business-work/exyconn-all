import { TicketDetailPage } from '@exyconn/shell/pages/ticket-desk';
import { useItSettingsQuery } from '@exyconn/shell/graphql/generated';

/** One IT ticket on its own page — where an escalation notification links to. */
export function HelpdeskTicketPage() {
  const { data } = useItSettingsQuery();
  return <TicketDetailPage backPath="/it/helpdesk" topics={data?.itSettings.ticketTopics} />;
}
