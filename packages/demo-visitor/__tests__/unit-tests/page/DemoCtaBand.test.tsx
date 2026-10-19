import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { DemoCtaBand } from '../../../src/page/DemoCtaBand';
import { renderWithProviders } from '../test-utils';
import { answerBranding, brand, brandingQuery } from './branding';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => brandingQuery(),
}));

const band = <DemoCtaBand title="Ready to go live?" subtitle="We set it up in a week." />;

describe('DemoCtaBand', () => {
  it('offers a consultation on the company website and an email', () => {
    answerBranding(brand());
    renderWithProviders(band);
    expect(screen.getByRole('region', { name: 'Ready to go live?' })).toBeInTheDocument();
    expect(screen.getByText('We set it up in a week.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Book a free consultation' })).toHaveAttribute(
      'href',
      'https://acme.example.test/contact',
    );
    expect(screen.getByRole('link', { name: 'Email us' })).toHaveAttribute(
      'href',
      'mailto:hello@acme.example.test',
    );
  });

  it('offers only the consultation when there is no support inbox', () => {
    answerBranding(brand({ supportEmail: '' }));
    renderWithProviders(band);
    expect(screen.getByRole('link', { name: 'Book a free consultation' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Email us' })).not.toBeInTheDocument();
  });

  it('disappears while the company has no website to send people to', () => {
    answerBranding(undefined);
    renderWithProviders(band);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.queryByText('Ready to go live?')).not.toBeInTheDocument();
  });
});
