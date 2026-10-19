import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { DemoFeatures } from '../../../src/page/DemoFeatures';
import { renderWithProviders } from '../test-utils';

const items = [
  { icon: <svg data-testid="fast-icon" />, title: 'Fast', body: 'Replies in seconds.' },
  { icon: <svg data-testid="safe-icon" />, title: 'Safe', body: 'Sample data only.' },
];

describe('DemoFeatures', () => {
  it('lists each reason with its icon hidden from screen readers', () => {
    renderWithProviders(<DemoFeatures items={items} />, { messages: { Fast: 'Rápido' } });
    const cards = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByRole('heading', { level: 3, name: 'Rápido' })).toBeInTheDocument();
    expect(cards[0]).toHaveTextContent('Replies in seconds.');
    expect(screen.getByTestId('safe-icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});
