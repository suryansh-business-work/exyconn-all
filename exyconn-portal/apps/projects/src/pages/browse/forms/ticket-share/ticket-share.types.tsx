import type { TicketOption } from '../../../projects/forms/ticket';

/** Somebody the ticket can be sent to — an active Projects user. */
export type TicketShareRecipient = TicketOption;

/** What the share form sends: who to tell, and an optional line to tell them. */
export interface TicketShareValues {
  recipientIds: string[];
  note: string;
}
