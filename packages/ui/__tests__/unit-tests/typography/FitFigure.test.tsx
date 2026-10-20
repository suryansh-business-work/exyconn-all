import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { FitFigure, fitFontSize } from '../../../src/typography';
import { fontWeight } from '../../../src/tokens/typography.token';
import { renderWithProviders } from '../test-utils';

describe('fitFontSize', () => {
  it('shrinks with the figure, between the 1rem floor and the given ceiling', () => {
    expect(fitFontSize(10, '2rem')).toBe('clamp(1rem, calc(100cqi / 6.20), 2rem)');
    expect(fitFontSize(1, '2rem')).toBe('clamp(1rem, calc(100cqi / 0.62), 2rem)');
  });

  it('treats an empty figure as one glyph, never dividing by zero', () => {
    expect(fitFontSize(0, '3rem')).toBe(fitFontSize(1, '3rem'));
    expect(fitFontSize(-4, '3rem')).toBe(fitFontSize(1, '3rem'));
  });
});

describe('FitFigure', () => {
  it('draws the figure as a paragraph sized to its own box', () => {
    renderWithProviders(<FitFigure value="₹2,00,000" />);
    const figure = screen.getByText('₹2,00,000');
    expect(figure.tagName).toBe('P');
    expect(figure).toHaveClass('MuiTypography-h4');
    expect(figure).toHaveStyle({ fontWeight: String(fontWeight.light) });
    expect(figure.parentElement).toHaveStyle({ containerType: 'inline-size' });
  });

  it('shows the placeholder instead of the figure while it loads', () => {
    renderWithProviders(<FitFigure value="42" placeholder={<span>loading</span>} weight="bold" />);
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
    expect(screen.getByText('loading').parentElement).toHaveStyle({
      fontWeight: String(fontWeight.bold),
    });
  });

  it('merges the caller sx onto the box', () => {
    renderWithProviders(<FitFigure value="7" sx={{ mt: 2 }} />);
    expect(screen.getByText('7').parentElement).toHaveStyle({ marginTop: '16px' });
  });
});
