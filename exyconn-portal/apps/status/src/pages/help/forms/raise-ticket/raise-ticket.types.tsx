import type { SupportCategory, SupportPriority } from '@exyconn/shell/graphql/generated';

/** What the public help form collects. Mirrors ClientSupportTicketInput. */
export interface RaiseTicketFormValues {
  requesterName: string;
  requesterEmail: string;
  subject: string;
  category: SupportCategory;
  description: string;
  priority: SupportPriority;
}

export interface RaiseTicketFormProps {
  /** Called with the reference the server minted, which is all the customer is told. */
  onSubmitted: (reference: string) => void;
  onCancel: () => void;
}
