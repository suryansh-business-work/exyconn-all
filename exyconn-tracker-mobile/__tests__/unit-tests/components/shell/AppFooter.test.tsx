import { screen } from '@testing-library/react';
import type { Branding } from '@exyconn/tracker-core';
import { describe, expect, it } from 'vitest';
import { AppFooter } from '../../../../src/components/shell/AppFooter';
import { renderWithProviders } from '../../test-utils';

function branding(copyrightText: string, legalName: string): Branding {
  return {
    businessName: 'Acme',
    legalName,
    slogan: '',
    logoUrl: '',
    logoDarkUrl: '',
    appIconUrl: '',
    faviconUrl: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#14b8a6',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#111111',
    supportEmail: '',
    websiteUrl: '',
    copyrightText,
  };
}

describe('AppFooter', () => {
  it('shows the notice the admin authored in the portal', () => {
    renderWithProviders(<AppFooter />, { branding: branding('© Acme, all yours.', '') });
    expect(screen.getByText('© Acme, all yours.')).toBeInTheDocument();
  });

  it("composes one from the workspace's legal name when none was authored", () => {
    renderWithProviders(<AppFooter />, { branding: branding('', 'Acme Ltd') });
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} Acme Ltd. All rights reserved.`)).toBeInTheDocument();
  });

  it('credits Exyconn before any branding has arrived', () => {
    renderWithProviders(<AppFooter />, { branding: null });
    expect(screen.getByText(/Exyconn\. All rights reserved\.$/)).toBeInTheDocument();
  });
});
