import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusHeader } from '../../../src/components/StatusHeader';
import { renderWithProviders } from '../test-utils';
import { CurrentUrl, currentUrl } from '../form-helpers';

interface BrandingStub {
  businessName: string;
  logoUrl: string;
  logoDarkUrl: string;
}

const branding = vi.hoisted(() => ({ value: null as BrandingStub | null }));

/** Branding is a 40-field query; the header reads three of them. */
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => ({
    data: branding.value ? { publicBranding: branding.value } : undefined,
  }),
}));

const MODE_KEY = 'exyconn-track.color-mode';
const ACME: BrandingStub = {
  businessName: 'Acme',
  logoUrl: 'https://cdn.example.com/acme-light.svg',
  logoDarkUrl: 'https://cdn.example.com/acme-dark.svg',
};

function renderHeader(route = '/') {
  renderWithProviders(
    <>
      <StatusHeader />
      <CurrentUrl />
    </>,
    { route },
  );
}

beforeEach(() => {
  localStorage.clear();
  branding.value = null;
});

describe('StatusHeader', () => {
  it('shows a holding title and the heartbeat until branding answers', () => {
    renderHeader();
    expect(screen.getByText('Exyconn Status')).toBeInTheDocument();
    expect(screen.getByText('Live availability of every service')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('names the page after the business and shows its light logo', () => {
    branding.value = ACME;
    renderHeader();
    expect(screen.getByText('Acme Status')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Acme Status' })).toHaveAttribute('src', ACME.logoUrl);
  });

  it('switches to the dark logo, and remembers the mode, when the colour mode is toggled', async () => {
    branding.value = ACME;
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Toggle colour mode' }));
    expect(screen.getByRole('img', { name: 'Acme Status' })).toHaveAttribute(
      'src',
      ACME.logoDarkUrl,
    );
    expect(localStorage.getItem(MODE_KEY)).toBe('dark');
  });

  it('falls back to the heartbeat in dark mode when there is no dark logo', () => {
    localStorage.setItem(MODE_KEY, 'dark');
    branding.value = { ...ACME, logoDarkUrl: '' };
    renderHeader();
    expect(screen.getByText('Acme Status')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('offers help and reporting from the status page', async () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: 'Back to status' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Get help' }));
    expect(currentUrl()).toBe('/help');
  });

  it('goes to the report form', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Report a problem' }));
    expect(currentUrl()).toBe('/report');
  });

  it.each(['/report', '/help'])('collapses both actions into one way back on %s', async (route) => {
    renderHeader(route);
    expect(screen.queryByRole('button', { name: 'Get help' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Report a problem' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to status' }));
    expect(currentUrl()).toBe('/');
  });
});
