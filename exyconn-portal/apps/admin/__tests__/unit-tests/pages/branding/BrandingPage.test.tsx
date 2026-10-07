import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BrandingDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { BrandingPage, BrandingPreview } from '../../../../src/pages/branding';
import { branding } from './branding.fixtures';

describe('BrandingPage', () => {
  it('says it is loading, then shows the branding form on its first tab', async () => {
    renderWithProviders(<BrandingPage />, {
      route: '/admin/branding',
      mocks: [{ request: { query: BrandingDocument }, result: { data: { branding: branding() } } }],
    });
    expect(screen.getByRole('heading', { name: 'Branding' })).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    expect(await screen.findByRole('textbox', { name: 'Business name' })).toHaveValue('Acme');
    expect(screen.getByRole('tab', { name: 'Identity' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('says branding is unavailable when it cannot be read', async () => {
    renderWithProviders(<BrandingPage />, {
      route: '/admin/branding/identity',
      mocks: [{ request: { query: BrandingDocument }, error: new Error('Forbidden') }],
    });
    expect(await screen.findByText('Branding is unavailable.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
  });
});

describe('BrandingPreview', () => {
  const props = {
    businessName: 'Acme',
    slogan: 'Built to last',
    primaryColor: '#155dfc',
  };

  it('shows the logo with an alt naming the business, the name and the slogan', () => {
    renderWithProviders(<BrandingPreview {...props} logoUrl="https://cdn.example.com/logo.png" />);
    expect(screen.getByRole('img', { name: 'Acme logo' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/logo.png',
    );
    expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByText('Built to last')).toBeInTheDocument();
    expect(screen.queryByText('No logo')).toBeNull();
  });

  it('says there is no logo when none is set', () => {
    renderWithProviders(<BrandingPreview {...props} logoUrl="" />);
    expect(screen.getByText('No logo')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
