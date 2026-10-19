import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEMOS } from '../../src/demos';
import { HubPage } from '../../src/HubPage';
import { HUB_FEATURES } from '../../src/hub.features';
import { HUB_FAQ, HUB_STEPS } from '../../src/hub.content';
import { renderWithProviders } from './test-utils';

describe('the demos hub page', () => {
  it('jumps from the hero to the demo list', () => {
    renderWithProviders(<HubPage />);
    expect(
      screen.getByRole('heading', { name: 'See our AI agents at work before you decide', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse the demos' })).toHaveAttribute('href', '#demos');
  });

  it('gives every demo a card with its photo, words and way in', () => {
    renderWithProviders(<HubPage />);
    const cards = screen.getAllByRole('listitem').filter((item) => within(item).queryByRole('img'));
    expect(cards).toHaveLength(DEMOS.length);
    DEMOS.forEach((demo, index) => {
      const card = within(cards[index]);
      expect(card.getByRole('heading', { name: demo.title, level: 3 })).toBeInTheDocument();
      expect(card.getByRole('img', { name: demo.photo.alt })).toHaveAttribute('src', demo.photo.src);
      expect(card.getByText(demo.description)).toBeInTheDocument();
      expect(card.getByText(demo.highlights[0])).toBeInTheDocument();
      expect(card.getByRole('link', { name: `Try the ${demo.title}` })).toHaveAttribute('href', demo.url);
    });
  });

  it('explains how to try, why, and what people ask', () => {
    renderWithProviders(<HubPage />);
    expect(screen.getByText(HUB_STEPS[1].title)).toBeInTheDocument();
    expect(screen.getByText(HUB_FEATURES[0].title)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: HUB_FAQ[0].question })).toBeInTheDocument();
  });
});
