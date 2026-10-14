import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { Ticket } from '@exyconn/wa-flow';
import { QrSvg } from '../../../../../src/components/wa/messages/QrSvg';
import { TicketMessage } from '../../../../../src/components/wa/messages/TicketMessage';
import { renderWithProviders } from '../../../test-utils';
import { frame, renderMessage } from './messages.fixtures';

const ticket: Ticket = {
  ticketId: 'TKT-88',
  title: 'Jazz night',
  subtitle: 'Hall B',
  fields: [
    { label: 'Seat', value: 'C12' },
    { label: 'Gate', value: '4' },
  ],
  qrData: 'TKT-88|C12',
};

describe('TicketMessage', () => {
  it('shows the pass with its QR code, id and details', () => {
    const { container } = renderMessage(
      <TicketMessage
        content={{ type: 'ticket', ticket, caption: 'Show this at the gate' }}
        frame={frame}
      />,
    );
    expect(screen.getByText('Jazz night')).toBeInTheDocument();
    expect(screen.getByText('Hall B')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'QR code for TKT-88' })).toBeInTheDocument();
    expect(screen.getByText('TKT-88')).toBeInTheDocument();
    const terms = [...container.querySelectorAll('dt')].map(
      (dt) => `${dt.textContent}=${dt.nextElementSibling?.textContent}`,
    );
    expect(terms).toEqual(['Seat=C12', 'Gate=4']);
    expect(screen.getByText('Show this at the gate')).toBeInTheDocument();
  });

  it('enlarges the QR code when tapped', async () => {
    const { actions, user } = renderMessage(
      <TicketMessage content={{ type: 'ticket', ticket }} frame={frame} />,
    );
    await user.click(screen.getByRole('button', { name: 'Enlarge QR code for TKT-88' }));
    expect(actions.openTicket).toHaveBeenCalledWith(ticket);
  });

  it('leaves out the subtitle and caption when there are none', () => {
    const plain = { ...ticket, subtitle: undefined, fields: [] };
    const { container } = renderMessage(
      <TicketMessage content={{ type: 'ticket', ticket: plain }} frame={frame} />,
    );
    expect(screen.queryByText('Hall B')).not.toBeInTheDocument();
    expect(container.querySelectorAll('dt')).toHaveLength(0);
  });
});

describe('QrSvg', () => {
  it('draws a scannable code with a quiet zone, and a different one for other data', () => {
    const { container, rerender } = renderWithProviders(
      <QrSvg data="TKT-88" size="168px" label="QR" />,
    );
    const svg = screen.getByRole('img', { name: 'QR' });
    const [, , width] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
    // Version 1 is 21 modules wide; two modules of quiet zone on each side.
    expect(width).toBe(25);
    const first = container.querySelectorAll('path')[0].getAttribute('d') ?? '';
    expect(first).toMatch(/^M2 2h1v1h-1z/);
    rerender(
      <QrSvg
        data="https://example.com/a-much-longer-payload-for-a-bigger-code"
        size="168px"
        label="QR"
      />,
    );
    const second = container.querySelectorAll('path')[0].getAttribute('d');
    expect(second).not.toBe(first);
  });
});
