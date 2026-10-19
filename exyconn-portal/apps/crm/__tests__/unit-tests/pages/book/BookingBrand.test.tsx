import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { env } from '@exyconn/shell/config/env';
import { BookingBrand } from '../../../../src/pages/book/BookingBrand';
import { renderWithProviders } from '../../test-utils';

const colour = vi.hoisted(() => ({ mode: 'light' }));

vi.mock('@exyconn/shell/theme/ColorModeContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/theme/ColorModeContext')>()),
  useColorMode: () => ({ mode: colour.mode }),
}));

const brand = {
  organizationName: 'Acme',
  logoUrl: 'https://cdn.acme.io/logo.svg',
  logoDarkUrl: 'https://cdn.acme.io/logo-dark.svg',
};

function logo() {
  return screen.getByRole('img', { name: 'Acme logo' });
}

describe('BookingBrand', () => {
  beforeEach(() => {
    colour.mode = 'light';
  });

  it('shows the company’s own logo in light mode', () => {
    renderWithProviders(<BookingBrand brand={brand} />);

    expect(logo()).toHaveAttribute('src', brand.logoUrl);
  });

  it('shows the company’s dark logo in dark mode', () => {
    colour.mode = 'dark';
    renderWithProviders(<BookingBrand brand={brand} />);

    expect(logo()).toHaveAttribute('src', brand.logoDarkUrl);
  });

  it('falls back to the portal logo for the mode when the company has none', () => {
    const bare = { organizationName: 'Acme', logoUrl: '', logoDarkUrl: '' };
    const { unmount } = renderWithProviders(<BookingBrand brand={bare} />);
    expect(logo()).toHaveAttribute('src', env.logoUrl);
    unmount();

    colour.mode = 'dark';
    renderWithProviders(<BookingBrand brand={bare} />);
    expect(logo()).toHaveAttribute('src', env.logoDarkUrl);
  });
});
