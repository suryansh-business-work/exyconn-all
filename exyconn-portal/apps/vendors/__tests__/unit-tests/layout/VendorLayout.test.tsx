import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { VendorLayout } from '../../../src/layout/VendorLayout';
import { vendorPass } from '../../../src/auth/vendorPass';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

const gql = vi.hoisted(() => ({ useVendorPortalMeQuery: vi.fn() }));
const apollo = vi.hoisted(() => ({ clearStore: vi.fn<() => Promise<unknown[]>>() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useApolloClient: () => apollo,
}));

const ME = {
  data: {
    vendorPortalMe: {
      name: 'Sam Supplier',
      email: 'sam@paper.test',
      supplierName: 'Paper Co',
      supplierCode: 'PAP',
    },
  },
};

function SignedOut() {
  return <p data-testid="signed-out">{useCurrentUrl()}</p>;
}

function renderLayout(route = '/orders') {
  renderWithProviders(
    <Routes>
      <Route element={<VendorLayout />}>
        <Route path="/orders" element={<p>Orders body</p>} />
        <Route path="/invoices" element={<p>Invoices body</p>} />
      </Route>
      <Route path="/login" element={<SignedOut />} />
    </Routes>,
    { route },
  );
  return userEvent.setup();
}

const sections = () => within(screen.getByRole('navigation', { name: 'Vendor portal sections' }));

describe('VendorLayout', () => {
  beforeEach(() => {
    gql.useVendorPortalMeQuery.mockReturnValue(ME);
    apollo.clearStore.mockResolvedValue([]);
  });
  afterEach(() => {
    vendorPass.clear();
    vi.clearAllMocks();
  });

  it('shows the portal, the supplier and the signed-in contact around the current page', () => {
    renderLayout();
    const bar = within(screen.getByRole('banner'));
    expect(bar.getByText('Vendor Portal')).toBeInTheDocument();
    expect(bar.getByText('Paper Co')).toBeInTheDocument();
    expect(bar.getByText('Sam Supplier')).toBeInTheDocument();
    expect(screen.getByText('Orders body')).toBeInTheDocument();
    expect(gql.useVendorPortalMeQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
  });

  it('links the two sections and marks the one in view', () => {
    renderLayout();
    const links = sections().getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Purchase orders', 'Invoices']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/orders', '/invoices']);
    expect(sections().getByRole('link', { name: 'Purchase orders' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(sections().getByRole('link', { name: 'Invoices' })).not.toHaveAttribute('aria-current');
  });

  it('moves between the sections', async () => {
    const user = renderLayout();
    await user.click(sections().getByRole('link', { name: 'Invoices' }));
    expect(await screen.findByText('Invoices body')).toBeInTheDocument();
    expect(sections().getByRole('link', { name: 'Invoices' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('renders the frame before the contact is known', () => {
    gql.useVendorPortalMeQuery.mockReturnValue({ data: undefined });
    renderLayout();
    expect(screen.getByText('Orders body')).toBeInTheDocument();
    expect(screen.queryByText('Paper Co')).not.toBeInTheDocument();
    expect(screen.queryByText('Sam Supplier')).not.toBeInTheDocument();
  });

  it('signs out: forgets the pass, empties the cache and returns to sign-in', async () => {
    vendorPass.store(`pass-${Date.now()}`);
    const user = renderLayout();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByTestId('signed-out')).toHaveTextContent('/login');
    expect(vendorPass.has()).toBe(false);
    expect(apollo.clearStore).toHaveBeenCalledTimes(1);
  });

  it('still signs out when the cache cannot be cleared, logging why', async () => {
    const failure = new Error('cache locked');
    apollo.clearStore.mockRejectedValue(failure);
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    vendorPass.store(`pass-${Date.now()}`);
    const user = renderLayout();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByTestId('signed-out')).toHaveTextContent('/login');
    expect(logged).toHaveBeenCalledWith(
      'Vendor portal: clearing the cache on sign-out failed',
      failure,
    );
    expect(vendorPass.has()).toBe(false);
    logged.mockRestore();
  });
});
