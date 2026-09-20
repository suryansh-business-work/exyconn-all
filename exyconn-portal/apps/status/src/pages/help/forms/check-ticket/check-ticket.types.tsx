import type { ClientSupportTicketStatusQuery } from '@exyconn/shell/graphql/generated';

/** The ticket as the public lookup returns it. */
export type ClientTicket = NonNullable<ClientSupportTicketStatusQuery['clientSupportTicketStatus']>;

export interface CheckTicketFormProps {
  onCancel: () => void;
}
