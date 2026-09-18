import type { TicketAttachmentInput } from '@exyconn/shell/graphql/generated';

/** Form values for replying on a ticket. */
export interface SupportReplyFormValues {
  body: string;
  internal: 'true' | 'false';
}

/** What the form sends alongside the message — the generated input, unchanged. */
export type SupportReplyAttachment = TicketAttachmentInput;
