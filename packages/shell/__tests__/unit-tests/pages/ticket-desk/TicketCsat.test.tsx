import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { TicketCsat } from '@/pages/ticket-desk/TicketCsat';
import { renderWithProviders } from '../../test-utils';

const SENT = '2026-10-30T09:15:00.000Z';

describe('TicketCsat', () => {
  it('shows nothing before a survey went out', () => {
    const { container } = renderWithProviders(<TicketCsat csatScore={5} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('says the survey is still out until the customer answers', () => {
    renderWithProviders(<TicketCsat csatSentAt={SENT} csatScore={null} />);

    expect(screen.getByText(/^Satisfaction survey sent .+, not answered yet$/)).toBeInTheDocument();
  });

  it("shows the customer's rating with their comment", () => {
    renderWithProviders(<TicketCsat csatSentAt={SENT} csatScore={4} csatComment="Quick fix" />);

    expect(screen.getByText('Customer rated this 4 out of 5 — “Quick fix”')).toBeInTheDocument();
  });

  it('shows a rating given without a comment on its own', () => {
    renderWithProviders(<TicketCsat csatSentAt={SENT} csatScore={1} csatComment="" />);

    expect(screen.getByText('Customer rated this 1 out of 5')).toBeInTheDocument();
  });
});
