import type { EscalateSupportTicketMutationVariables } from '@/graphql/generated';

/** What the escalate form collects: why the ticket needs more attention. */
export type TicketEscalateValues = Pick<EscalateSupportTicketMutationVariables, 'reason'>;
