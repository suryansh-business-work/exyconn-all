import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from '../../../../src/components/ui/Icon';
import { CHROME } from '../../../../src/theme/palette';
import { renderWithProviders } from '../../test-utils';

describe('Icon', () => {
  it("draws a decorative glyph in the theme's ink, hidden from screen readers", () => {
    renderWithProviders(<Icon name="check" />);
    const glyph = screen.getByTestId('icon-check');
    expect(glyph).toHaveAttribute('data-size', '20');
    expect(glyph).toHaveAttribute('data-color', CHROME.light.ink);
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('follows the dark theme', () => {
    renderWithProviders(<Icon name="check" />, { themeMode: 'dark' });
    expect(screen.getByTestId('icon-check')).toHaveAttribute('data-color', CHROME.dark.ink);
  });

  it('names a glyph that carries meaning on its own, in the colour it was given', () => {
    renderWithProviders(<Icon name="alert" size={14} color="#ff0000" label="Offline" />);
    const glyph = screen.getByRole('img', { name: 'Offline' });
    expect(glyph).toHaveAttribute('data-size', '14');
    expect(glyph).toHaveAttribute('data-color', '#ff0000');
    expect(glyph).not.toHaveAttribute('aria-hidden');
  });
});
