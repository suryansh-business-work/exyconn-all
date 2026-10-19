import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MockSite } from '../../../src/components/MockSite';
import { site, workflow } from '../fixtures';
import { renderWithProviders } from '../test-utils';

const QUOTE = workflow('quote', 'Get a quote');
const BOOKING = workflow('booking', 'Book a call');

describe("the demo business's own website", () => {
  it('draws the business from its profile', () => {
    renderWithProviders(<MockSite site={site('advisory', {}, [QUOTE])} onAsk={vi.fn()} />);
    expect(screen.getByText('Northwind Advisory')).toBeInTheDocument();
    expect(screen.getByText('Advice that pays for itself')).toBeInTheDocument();
    expect(screen.getByText('Consulting')).toBeInTheDocument();
    expect(screen.getByText('MG Road, Bengaluru · Mon–Sat 9–6 · hello@northwind.example')).toBeInTheDocument();
  });

  it('starts the first workflow from Chat with us, and any workflow from its tile', async () => {
    const onAsk = vi.fn();
    renderWithProviders(<MockSite site={site('advisory', {}, [QUOTE, BOOKING])} onAsk={onAsk} />);
    await userEvent.click(screen.getByRole('button', { name: 'Chat with us' }));
    await userEvent.click(screen.getByRole('button', { name: /Book a call/ }));
    expect(onAsk.mock.calls).toEqual([['quote'], ['booking']]);
  });

  it('offers no chat button without workflows, and skips missing contact details', () => {
    renderWithProviders(
      <MockSite site={site('advisory', { address: '', hours: '' })} onAsk={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: 'Chat with us' })).not.toBeInTheDocument();
    expect(screen.getByText('hello@northwind.example')).toBeInTheDocument();
  });
});
