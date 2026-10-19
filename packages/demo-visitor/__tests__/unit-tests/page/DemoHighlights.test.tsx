import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DemoHighlights } from '../../../src/page/DemoHighlights';
import { renderWithProviders } from '../test-utils';

describe('DemoHighlights', () => {
  it('lists what the demo proves, translated, one line each', () => {
    renderWithProviders(<DemoHighlights items={['Real calls', 'No sign-up']} />, {
      messages: { 'Real calls': 'Llamadas reales' },
    });
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Llamadas reales',
      'No sign-up',
    ]);
  });
});
