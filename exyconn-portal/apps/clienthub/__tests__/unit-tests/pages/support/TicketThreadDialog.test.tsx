import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupportCategory, SupportPriority, SupportStatus } from '@exyconn/shell/graphql/generated';
import { TicketThreadDialog } from '../../../../src/pages/support/TicketThreadDialog';
import type { ClientTicketRow } from '../../../../src/pages/support/tickets-grid';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  useClientHubTicketRepliesQuery: vi.fn(),
  useClientHubReplyToTicketMutation: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const TICKET: ClientTicketRow = {
  id: 't-1',
  reference: 'TCK-1',
  subject: 'Invoice total looks wrong',
  category: SupportCategory.Other,
  description: 'The March invoice charges twice for the same week.',
  priority: SupportPriority.High,
  status: SupportStatus.InProgress,
  createdAt: '2026-10-01T09:30:00.000Z',
  updatedAt: '2026-10-02T14:05:00.000Z',
};
const REPLY = {
  id: 'r-1',
  authorName: 'Priya from Support',
  body: 'We have refunded the duplicate week.',
  createdAt: '2026-10-02T14:05:00.000Z',
};
const refetch = vi.fn();
const reply = vi.fn();

describe('TicketThreadDialog', () => {
  beforeEach(() => {
    gql.useClientHubTicketRepliesQuery.mockReturnValue({
      data: { clientHubTicketReplies: [REPLY] },
      refetch,
    });
    gql.useClientHubReplyToTicketMutation.mockReturnValue([reply, {}]);
  });
  afterEach(() => vi.clearAllMocks());

  it('stays closed, and asks nothing, without a ticket', () => {
    gql.useClientHubTicketRepliesQuery.mockReturnValue({ data: undefined, refetch });
    renderWithProviders(<TicketThreadDialog ticket={null} onClose={vi.fn()} />);
    expect(gql.useClientHubTicketRepliesQuery).toHaveBeenCalledWith({
      variables: { ticketId: '' },
      skip: true,
    });
    expect(screen.queryByText(/You wrote/)).not.toBeInTheDocument();
  });

  it('shows the ticket, what the client wrote and every reply, oldest first', () => {
    renderWithProviders(<TicketThreadDialog ticket={TICKET} onClose={vi.fn()} />);
    expect(gql.useClientHubTicketRepliesQuery).toHaveBeenCalledWith({
      variables: { ticketId: 't-1' },
      skip: false,
    });
    expect(screen.getByText('TCK-1 — Invoice total looks wrong')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('You wrote, 01 Oct 2026 09:30 AM')).toBeInTheDocument();
    expect(screen.getByText(TICKET.description)).toBeInTheDocument();
    expect(screen.getByText('Priya from Support, 02 Oct 2026 02:05 PM')).toBeInTheDocument();
    expect(screen.getByText(REPLY.body)).toBeInTheDocument();
  });

  it('shows just the ticket while no replies have come back', () => {
    gql.useClientHubTicketRepliesQuery.mockReturnValue({ data: undefined, refetch });
    renderWithProviders(<TicketThreadDialog ticket={TICKET} onClose={vi.fn()} />);
    expect(screen.getByText(TICKET.description)).toBeInTheDocument();
    expect(screen.queryByText(REPLY.body)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Your reply')).toBeInTheDocument();
  });

  it('reloads the thread once the client has replied', async () => {
    reply.mockResolvedValue({ data: { clientHubReplyToTicket: REPLY } });
    const user = userEvent.setup();
    renderWithProviders(<TicketThreadDialog ticket={TICKET} onClose={vi.fn()} />);
    await user.type(screen.getByLabelText('Your reply'), 'Thank you!');
    await user.click(screen.getByRole('button', { name: 'Send reply' }));
    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(reply).toHaveBeenCalledWith({ variables: { ticketId: 't-1', body: 'Thank you!' } });
  });

  it('closes from its close button', async () => {
    const onClose = vi.fn();
    renderWithProviders(<TicketThreadDialog ticket={TICKET} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
