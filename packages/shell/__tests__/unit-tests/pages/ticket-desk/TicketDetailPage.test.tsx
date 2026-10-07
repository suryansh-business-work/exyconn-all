import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { useGetSupportTicketQuery } from '@/graphql/generated';
import { TicketDetailPage, type DetailTicket } from '@/pages/ticket-desk';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from '../hookMocks';
import { makeTicket } from './ticketFixture';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useGetSupportTicketQuery: vi.fn(),
}));

interface BodyStubProps {
  ticket: DetailTicket;
  topics?: readonly string[];
  onChanged: () => void;
  onCancel: () => void;
}

// The body has its own test; the stub shows what the page handed it.
vi.mock('@/pages/ticket-desk/TicketDetailBody', () => ({
  TicketDetailBody: ({ ticket, topics, onChanged, onCancel }: Readonly<BodyStubProps>) => (
    <div>
      <p>{`body ${ticket.id} ${topics?.join('/') ?? ''}`}</p>
      <button type="button" onClick={onChanged}>
        changed
      </button>
      <button type="button" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
}));

function renderAt(route: string, result: ReturnType<typeof queryResult>) {
  vi.mocked(useGetSupportTicketQuery).mockReturnValue(result as never);
  renderWithProviders(
    <Routes>
      <Route
        path="/tickets/:id"
        element={<TicketDetailPage backPath="/queue" topics={['VPN']} />}
      />
      <Route path="/tickets" element={<TicketDetailPage backPath="/queue" />} />
      <Route path="/queue" element={<p>the queue</p>} />
    </Routes>,
    { route },
  );
}

describe('TicketDetailPage', () => {
  it("heads the page with the ticket's own words and shows its body", async () => {
    const result = queryResult({ getSupportTicket: makeTicket() });
    renderAt('/tickets/t-1', result);

    expect(useGetSupportTicketQuery).toHaveBeenCalledWith({
      variables: { id: 't-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Laptop will not boot' }),
    ).toBeInTheDocument();
    expect(screen.getByText('SUP-101')).toBeInTheDocument();
    expect(screen.getByText('body t-1 VPN')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'changed' }));
    expect(result.refetch).toHaveBeenCalledTimes(1);
  });

  it('swallows a failed reload, leaving the ticket on screen', async () => {
    const result = queryResult(
      { getSupportTicket: makeTicket() },
      { refetch: vi.fn().mockRejectedValue(new Error('offline')) },
    );
    renderAt('/tickets/t-1', result);
    await userEvent.click(screen.getByRole('button', { name: 'changed' }));
    expect(result.refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('body t-1 VPN')).toBeInTheDocument();
  });

  it('goes back to the queue from the header or the reply box', async () => {
    renderAt('/tickets/t-1', queryResult({ getSupportTicket: makeTicket() }));
    await userEvent.click(screen.getByRole('button', { name: 'cancel' }));
    expect(screen.getByText('the queue')).toBeInTheDocument();
  });

  it('says it is loading, then that the ticket is gone', async () => {
    renderAt('/tickets/t-9', queryResult(undefined, { loading: true }));
    expect(screen.getByRole('heading', { level: 1, name: 'Ticket' })).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back to queue' }));
    expect(screen.getByText('the queue')).toBeInTheDocument();
  });

  it('says a ticket no longer exists, skipping the query without an id', () => {
    renderAt('/tickets', queryResult(undefined));
    expect(useGetSupportTicketQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ variables: { id: '' }, skip: true }),
    );
    expect(screen.getByText('This ticket no longer exists.')).toBeInTheDocument();
  });
});
