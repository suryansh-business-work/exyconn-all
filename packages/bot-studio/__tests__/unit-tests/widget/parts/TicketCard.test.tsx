import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { Ticket } from '@exyconn/wa-flow';
import { TicketCard } from '../../../../src/widget/parts/TicketCard';
import { renderPart } from '../widget.fixtures';

const TICKET: Ticket = {
  ticketId: 'TKT-42',
  title: 'Concert pass',
  fields: [
    { label: 'Seat', value: 'B12' },
    { label: 'Gate', value: '3' },
  ],
  qrData: 'TKT-42',
};

describe('TicketCard', () => {
  it('heads the card with its title and number, then lists the details as terms', () => {
    renderPart(<TicketCard ticket={{ ...TICKET, subtitle: 'Saturday 8 pm' }} caption="See you" />);
    expect(screen.getByText('Concert pass')).toBeInTheDocument();
    expect(screen.getByText('TKT-42')).toBeInTheDocument();
    expect(screen.getByText('Saturday 8 pm')).toBeInTheDocument();
    expect(screen.getByText('Seat').tagName).toBe('DT');
    expect(screen.getByText('B12').tagName).toBe('DD');
    expect(screen.getByText('Gate')).toBeInTheDocument();
    expect(screen.getByText('See you')).toBeInTheDocument();
  });

  it('leaves out the subtitle and caption it was not given', () => {
    const { container } = renderPart(<TicketCard ticket={TICKET} />);
    // Header box and the details list only.
    expect(container.querySelector('.MuiPaper-root')?.childElementCount).toBe(2);
  });
});
