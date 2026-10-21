import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { ClientHubLayout } from '../../../src/layout/ClientHubLayout';
import { clientPass } from '../../../src/auth/clientPass';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

const gql = vi.hoisted(() => ({ useClientHubMeQuery: vi.fn(), usePublicBrandingQuery: vi.fn() }));
const apollo = vi.hoisted(() => ({ clearStore: vi.fn<() => Promise<unknown[]>>() }));
const colour = vi.hoisted(() => ({ mode: 'light' as 'light' | 'dark', toggle: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useApolloClient: () => apollo,
}));

vi.mock('@exyconn/shell/theme/ColorModeContext', () => ({ useColorMode: () => colour }));

const me = (company: string, clientName = 'Acme') => ({
  data: { clientHubMe: { name: 'Ada Lovelace', email: 'ada@acme.com', clientName, company } },
});

function SignedOut() {
  return <p data-testid="signed-out">{useCurrentUrl()}</p>;
}

function renderLayout() {
  renderWithProviders(
    <Routes>
      <Route element={<ClientHubLayout />}>
        <Route path="/dashboard" element={<p>Overview body</p>} />
        <Route path="/invoices" element={<p>Invoices body</p>} />
      </Route>
      <Route path="/login" element={<SignedOut />} />
    </Routes>,
    { route: '/dashboard' },
  );
  return userEvent.setup();
}

describe('ClientHubLayout', () => {
  beforeEach(() => {
    colour.mode = 'light';
    gql.useClientHubMeQuery.mockReturnValue(me('Acme Ltd'));
    gql.usePublicBrandingQuery.mockReturnValue({ data: undefined });
    apollo.clearStore.mockResolvedValue([]);
  });
  afterEach(() => {
    clientPass.clear();
    vi.clearAllMocks();
  });

  it('shows the brand, the company and the signed-in contact around the current page', () => {
    renderLayout();
    expect(screen.getAllByText('Client Hub').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acme Ltd').length).toBeGreaterThan(0);
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Overview body')).toBeInTheDocument();
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    expect(gql.useClientHubMeQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
  });

  it('uses the branded logo when Branding has one for the current mode', () => {
    colour.mode = 'dark';
    gql.usePublicBrandingQuery.mockReturnValue({
      data: {
        publicBranding: { logoUrl: 'https://cdn/light.png', logoDarkUrl: 'https://cdn/dark.png' },
      },
    });
    renderLayout();
    const logos = screen.getAllByRole('img').map((img) => img.getAttribute('src'));
    expect(logos).toContain('https://cdn/dark.png');
  });

  it('links the eight sections and marks the one in view', () => {
    renderLayout();
    const nav = within(screen.getByRole('navigation', { name: 'Client hub sections' }));
    const links = nav.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Overview',
      'Invoices',
      'Transactions',
      'Support',
      'Projects',
      'Contracts & documents',
      'Communication log',
      'Important links',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard',
      '/invoices',
      '/transactions',
      '/support',
      '/projects',
      '/documents',
      '/communications',
      '/links',
    ]);
    expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Invoices' })).not.toHaveAttribute('aria-current');
  });

  it('opens the sections from the menu on a phone and closes them after a pick', async () => {
    const user = renderLayout();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    const drawer = await screen.findByRole('presentation');
    await user.click(within(drawer).getByRole('link', { name: 'Invoices' }));
    expect(await screen.findByText('Invoices body')).toBeInTheDocument();
  });

  it('switches between light and dark mode', async () => {
    const user = renderLayout();
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(colour.toggle).toHaveBeenCalledTimes(1);
  });

  it('offers light mode while dark', () => {
    colour.mode = 'dark';
    renderLayout();
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it("names the client when the contact's company is blank", () => {
    gql.useClientHubMeQuery.mockReturnValue(me('', 'Acme Holdings'));
    renderLayout();
    expect(screen.getAllByText('Acme Holdings').length).toBeGreaterThan(0);
  });

  it('renders the frame before the contact is known', () => {
    gql.useClientHubMeQuery.mockReturnValue({ data: undefined });
    renderLayout();
    expect(screen.getByText('Overview body')).toBeInTheDocument();
    expect(screen.queryByText('Acme Ltd')).not.toBeInTheDocument();
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });

  it('signs out: forgets the pass, empties the cache and returns to sign-in', async () => {
    clientPass.store(`pass-${Date.now()}`);
    const user = renderLayout();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByTestId('signed-out')).toHaveTextContent('/login');
    expect(clientPass.has()).toBe(false);
    expect(apollo.clearStore).toHaveBeenCalledTimes(1);
  });

  it('still signs out when the cache cannot be cleared, logging why', async () => {
    const failure = new Error('cache locked');
    apollo.clearStore.mockRejectedValue(failure);
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    clientPass.store(`pass-${Date.now()}`);
    const user = renderLayout();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByTestId('signed-out')).toHaveTextContent('/login');
    expect(logged).toHaveBeenCalledWith(
      'Client hub: clearing the cache on sign-out failed',
      failure,
    );
    expect(clientPass.has()).toBe(false);
    logged.mockRestore();
  });
});
