import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CallHeroVisual } from '../../../src/pages/CallHeroVisual';
import { renderWithProviders } from '../test-utils';

vi.mock('../../../src/components/BrowserCallPanel', () => ({
  BrowserCallPanel: ({ scenarioId }: Readonly<{ scenarioId: string | null }>) => (
    <p>{`Phone for ${scenarioId ?? 'no example'}`}</p>
  ),
}));

describe("the hero's call visual", () => {
  it('holds a skeleton while the settings load', () => {
    renderWithProviders(<CallHeroVisual loading available scenarioId="s1" />);
    expect(screen.queryByText(/Phone for/)).not.toBeInTheDocument();
    expect(screen.queryByText('The calling bot is not set up yet')).not.toBeInTheDocument();
  });

  it('shows the phone once the bot is set up', () => {
    renderWithProviders(<CallHeroVisual loading={false} available scenarioId="s1" />);
    expect(screen.getByText('Phone for s1')).toBeInTheDocument();
  });

  it('says the bot is not set up yet', () => {
    renderWithProviders(<CallHeroVisual loading={false} available={false} scenarioId={null} />);
    expect(screen.getByText('The calling bot is not set up yet')).toBeInTheDocument();
    expect(screen.getByText('Please check back soon.')).toBeInTheDocument();
  });
});
