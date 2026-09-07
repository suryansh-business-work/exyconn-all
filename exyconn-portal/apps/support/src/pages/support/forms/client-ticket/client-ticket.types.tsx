import type { ClientSupportTicketInput } from '@exyconn/shell/graphql/generated';

/** What the customer-ticket form submits — the generated input, unchanged. */
export type ClientTicketFormValues = ClientSupportTicketInput;

/**
 * Server-side limits, mirrored so the form rejects exactly what the API rejects.
 * Kept beside the type because both sides of the contract belong together.
 */
export const CLIENT_TICKET_LIMITS = {
  name: { min: 2, max: 80 },
  subject: { min: 5, max: 120 },
  description: { min: 20, max: 4000 },
} as const;
