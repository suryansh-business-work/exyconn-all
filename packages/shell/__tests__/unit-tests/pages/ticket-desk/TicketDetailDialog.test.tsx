import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketDetailDialog, type DetailTicket } from '@/pages/ticket-desk';
import { renderWithProviders } from '../../test-utils';
import { makeTicket } from './ticketFixture';

interface BodyStubProps {
  ticket: DetailTicket;
  topics?: readonly string[];
  onChanged: () => void;
  onCancel: () => void;
}

// The body has its own test; the stub shows what the drawer handed it.
vi.mock('@/pages/ticket-desk/TicketDetailBody', () => ({
  TicketDetailBody: ({ ticket, topics, onChanged, onCancel }: Readonly<BodyStubProps>) => (
    <div>
      <p>{`body ${ticket.reference} ${topics?.join('/') ?? ''}`}</p>
      <button type="button" onClick={onChanged}>
        changed
      </button>
      <button type="button" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
}));

describe('TicketDetailDialog', () => {
  it('renders nothing when no ticket is open', () => {
    const { container } = renderWithProviders(
      <TicketDetailDialog ticket={null} onClose={vi.fn()} onChanged={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('opens the ticket in a drawer titled with its subject', async () => {
    const onClose = vi.fn();
    const onChanged = vi.fn();
    renderWithProviders(
      <TicketDetailDialog
        ticket={makeTicket()}
        onClose={onClose}
        onChanged={onChanged}
        topics={['Laptop']}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Laptop will not boot' })).toBeInTheDocument();
    expect(screen.getByText('body SUP-101 Laptop')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'changed' }));
    expect(onChanged).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
