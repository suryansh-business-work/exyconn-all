import type { MockLink } from '@apollo/client/testing';
import {
  ClientSupportTicketStatusDocument,
  CreateClientSupportTicketDocument,
  SupportCategory,
  SupportPriority,
  SupportStatus,
} from '@exyconn/shell/graphql/generated';
import type { ClientTicket } from '../../../../src/pages/help/forms/check-ticket';

export const REFERENCE = 'EXY-ABC234';
export const EMAIL = 'ada@example.com';

/** What a customer types into the help form, already trimmed as the schema leaves it. */
export const ticketInput = {
  requesterName: 'Ada Lovelace',
  requesterEmail: EMAIL,
  subject: 'Payslip is missing',
  category: SupportCategory.Other,
  description: 'My September payslip never arrived in my inbox.',
  priority: SupportPriority.Medium,
};

export const raised = (
  input: typeof ticketInput = ticketInput,
  error?: Error,
): MockLink.MockedResponse => ({
  request: { query: CreateClientSupportTicketDocument, variables: { input } },
  ...(error ? { error } : { result: { data: { createClientSupportTicket: REFERENCE } } }),
});

export const ticket = (overrides: Partial<ClientTicket> = {}): ClientTicket => ({
  __typename: 'ClientTicketStatus',
  reference: REFERENCE,
  subject: 'Payslip is missing',
  status: SupportStatus.InProgress,
  updatedAt: '2026-09-05T10:00:00.000Z',
  replies: [],
  ...overrides,
});

export const lookedUp = (
  answer: ClientTicket | null | Error,
  variables = { reference: REFERENCE, email: EMAIL },
): MockLink.MockedResponse => ({
  request: { query: ClientSupportTicketStatusDocument, variables },
  ...(answer instanceof Error
    ? { error: answer }
    : { result: { data: { clientSupportTicketStatus: answer } } }),
});
