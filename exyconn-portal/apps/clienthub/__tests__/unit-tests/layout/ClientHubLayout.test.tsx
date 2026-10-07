import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { ClientHubLayout } from '../../../src/layout/ClientHubLayout';
import { clientPass } from '../../../src/auth/clientPass';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

const gql = vi.hoisted(() => ({ useClientHubMeQuery: vi.fn() }));
const apollo = vi.hoisted(() => ({ clearStore: vi.fn<() => Promise<unknown[]>>() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useApolloClient: () => apollo,
}));

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
      </Route>
      <Route path="/login" element={<SignedOut />} />
    </Routes>,
    { route: '/dashboard' },
  );
  return userEvent.setup();
}

describe('ClientHubLayout', () => {
  beforeEach(() => {
    gql.useClientHubMeQuery.mockReturnValue(me('Acme Ltd'));
    apollo.clearStore.mockResolvedValue([]);
  });
  afterEach(() => {
    clientPass.clear();
    vi.clearAllMocks();
  });

  it('shows the company and the signed-in contact around the current page', () => {
    renderLayout();
    expect(screen.getByText('Client Hub')).toBeInTheDocument();
    expect(screen.getByText('Acme Ltd')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Overview body')).toBeInTheDocument();
    expect(gql.useClientHubMeQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
  });

  it('links the five sections and marks the one in view', () => {
    renderLayout();
    const nav = within(screen.getByRole('navigation', { name: 'Client hub sections' }));
    const links = nav.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Overview',
      'Invoices',
      'Transactions',
      'Support',
      'Projects',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard',
      '/invoices',
      '/transactions',
      '/support',
      '/projects',
    ]);
    expect(nav.getByRole('link', { name: 'Overview' })).toHaveClass('active');
    expect(nav.getByRole('link', { name: 'Invoices' })).not.toHaveClass('active');
  });

  it("names the client when the contact's company is blank", () => {
    gql.useClientHubMeQuery.mockReturnValue(me('', 'Acme Holdings'));
    renderLayout();
    expect(screen.getByText('Acme Holdings')).toBeInTheDocument();
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
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    clientPass.store(`pass-${Date.now()}`);
    const user = renderLayout();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByTestId('signed-out')).toHaveTextContent('/login');
    expect(logged).toHaveBeenCalledWith('Could not clear the cache', failure);
    expect(clientPass.has()).toBe(false);
    logged.mockRestore();
  });
});
