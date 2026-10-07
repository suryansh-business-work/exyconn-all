import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { StatusShell } from '../../../src/components/StatusShell';
import { renderWithProviders } from '../test-utils';

const shellEnv = vi.hoisted(() => ({
  env: { brandUrl: 'https://exyconn.com/', portalDomain: '' },
}));

/** Only the deploy-time domain matters to the footer, and it differs per environment. */
vi.mock('@exyconn/shell', () => shellEnv);

describe('StatusShell', () => {
  it('frames the page with the brand header, the content and the footer', () => {
    renderWithProviders(
      <StatusShell>
        <p>Page body</p>
      </StatusShell>,
    );
    expect(screen.getByRole('banner')).toHaveTextContent('Exyconn Status');
    expect(screen.getByRole('main')).toHaveTextContent('Page body');
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      `© ${new Date().getFullYear()} Exyconn. Availability is measured from our own monitoring`,
    );
  });

  it('links to the brand site and to the default support mailbox without a portal domain', () => {
    shellEnv.env.portalDomain = '';
    renderWithProviders(<StatusShell>content</StatusShell>);
    expect(screen.getByRole('link', { name: 'exyconn.com' })).toHaveAttribute(
      'href',
      'https://exyconn.com/',
    );
    expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute(
      'href',
      'mailto:support@exyconn.com',
    );
  });

  it('mails support at the deployment’s own domain when one is set', () => {
    shellEnv.env.portalDomain = 'example.org';
    renderWithProviders(<StatusShell>content</StatusShell>);
    expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute(
      'href',
      'mailto:support@example.org',
    );
  });
});
