import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DealScoreChip, signedImpact } from '../../../../../src/pages/deals/score/DealScoreChip';
import { renderWithProviders } from '../../../test-utils';

const reasons = [
  { __typename: 'DealScoreReason' as const, text: 'PROPOSAL stage', impact: 50 },
  { __typename: 'DealScoreReason' as const, text: '2 overdue task(s)', impact: -10 },
  { __typename: 'DealScoreReason' as const, text: 'Deal lost', impact: 0 },
];

describe('signedImpact', () => {
  it('signs a gain, keeps the minus of a loss and shows no sign for nothing', () => {
    expect(signedImpact(10)).toBe('+10');
    expect(signedImpact(-5)).toBe('-5');
    expect(signedImpact(0)).toBe('0');
  });
});

describe('DealScoreChip', () => {
  it('says the deal has not been scored yet', () => {
    renderWithProviders(<DealScoreChip deal={{ score: null, scoreReasons: [] }} />);

    expect(screen.getByText('Not scored')).toBeInTheDocument();
  });

  it('shows the score out of 100, can be focused, and lists its reasons on hover', async () => {
    renderWithProviders(<DealScoreChip deal={{ score: 40, scoreReasons: reasons }} />);

    const chip = screen.getByLabelText('Deal score 40 out of 100');
    expect(chip).toHaveTextContent('40/100');
    await userEvent.tab();
    expect(chip).toHaveFocus();
    await userEvent.hover(chip);

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('+50 PROPOSAL stage');
    expect(tooltip).toHaveTextContent('-10 2 overdue task(s)');
    expect(tooltip).toHaveTextContent('0 Deal lost');
  });

  it.each([
    [85, 'success'],
    [50, 'warning'],
    [0, 'error'],
  ])('colours a score of %i as %s', (score, colour) => {
    renderWithProviders(<DealScoreChip deal={{ score, scoreReasons: [] }} />);

    expect(screen.getByLabelText(`Deal score ${score} out of 100`).className).toMatch(
      new RegExp(`MuiChip-color${colour[0].toUpperCase()}${colour.slice(1)}`),
    );
  });
});
