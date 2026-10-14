import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Ticket } from '@exyconn/wa-flow';
import { TicketDialog } from '../../../../../src/components/wa/chat/TicketDialog';
import { renderWithProviders } from '../../../test-utils';

const PASS: Ticket = {
  ticketId: 'TKT-204',
  title: 'Concert pass',
  subtitle: 'Gate 3, Row F',
  fields: [],
  qrData: 'TKT-204',
};

describe('TicketDialog', () => {
  it('shows a scannable QR code with the ticket id and subtitle', async () => {
    renderWithProviders(<TicketDialog ticket={PASS} onClose={vi.fn()} />);
    const dialog = await screen.findByRole('dialog', { name: 'Concert pass' });
    const qr = within(dialog).getByRole('img', { name: 'QR code for TKT-204' });
    expect(qr.querySelector('path')?.getAttribute('d')).toMatch(/^M\d+ \d+h1v1h-1z/);
    expect(within(dialog).getByText('TKT-204')).toBeInTheDocument();
    expect(within(dialog).getByText('Gate 3, Row F')).toBeInTheDocument();
  });

  it('leaves out a missing subtitle', async () => {
    renderWithProviders(
      <TicketDialog ticket={{ ...PASS, subtitle: undefined }} onClose={vi.fn()} />,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Concert pass' });
    expect(dialog).not.toHaveTextContent('Gate 3');
  });

  it('closes from its button', async () => {
    const onClose = vi.fn();
    renderWithProviders(<TicketDialog ticket={PASS} onClose={onClose} />);
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is closed without a ticket', () => {
    renderWithProviders(<TicketDialog ticket={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
