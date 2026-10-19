import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DemoHero } from '../../../src/page/DemoHero';
import { renderWithProviders } from '../test-utils';

describe('DemoHero', () => {
  it('shows the eyebrow, the page title, the pitch, the actions and the visual', () => {
    renderWithProviders(
      <DemoHero
        eyebrow="Live demo"
        title="A bot that answers calls"
        subtitle="Try it on your own phone."
        visual={<img src="/demo.jpg" alt="Demo preview" />}
      >
        <button type="button">Call me</button>
      </DemoHero>,
      { messages: { 'Live demo': 'Demo en vivo' } },
    );
    expect(screen.getByText('Demo en vivo')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'A bot that answers calls' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Try it on your own phone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Call me' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Demo preview' })).toBeInTheDocument();
  });
});
