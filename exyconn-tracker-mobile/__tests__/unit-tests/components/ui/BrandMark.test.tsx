import { screen } from '@testing-library/react';
import type { Branding } from '@exyconn/tracker-core';
import { describe, expect, it } from 'vitest';
import { BrandMark } from '../../../../src/components/ui/BrandMark';
import { renderWithProviders } from '../../test-utils';

function branding(overrides: Partial<Branding> = {}): Branding {
  return {
    businessName: 'Acme Works',
    legalName: 'Acme Works Ltd',
    slogan: '',
    logoUrl: 'https://cdn.example.test/logo.png',
    logoDarkUrl: '',
    appIconUrl: '',
    faviconUrl: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#14b8a6',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#111111',
    supportEmail: 'help@example.test',
    websiteUrl: 'https://example.test',
    copyrightText: '',
    ...overrides,
  };
}

describe('BrandMark', () => {
  it("draws the workspace's logo, named for screen readers, on the light palette", () => {
    renderWithProviders(<BrandMark />, { branding: branding(), themeMode: 'light' });
    const logo = screen.getByRole('img', { name: 'Acme Works' });
    expect(logo).toHaveAttribute('src', 'https://cdn.example.test/logo.png');
    expect(screen.queryByText('Acme Works')).not.toBeInTheDocument();
  });

  it("writes the name beside the tracker's own icon on the dark palette", () => {
    renderWithProviders(<BrandMark height={20} />, { branding: branding(), themeMode: 'dark' });
    expect(screen.getByText('Acme Works')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Acme Works' })).not.toBeInTheDocument();
  });

  it('falls back to plain type, and to Exyconn, when there is no logo or name', () => {
    renderWithProviders(<BrandMark />, {
      branding: branding({ logoUrl: '', businessName: '' }),
      themeMode: 'light',
    });
    expect(screen.getByText('Exyconn')).toBeInTheDocument();
  });

  it('shows Exyconn before any branding has arrived', () => {
    renderWithProviders(<BrandMark />, { branding: null, themeMode: 'light' });
    expect(screen.getByText('Exyconn')).toBeInTheDocument();
  });
});
