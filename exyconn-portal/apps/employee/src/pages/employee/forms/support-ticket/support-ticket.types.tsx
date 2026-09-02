import type { SupportCategory, SupportPriority } from '@exyconn/shell/graphql/generated';

/** Form values for raising an employee support ticket. */
export interface SupportTicketFormValues {
  subject: string;
  category: SupportCategory;
  description: string;
  priority: SupportPriority;
}
