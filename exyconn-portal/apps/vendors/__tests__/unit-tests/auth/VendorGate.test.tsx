import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { VendorGate } from '../../../src/auth/VendorGate';
import { vendorPass } from '../../../src/auth/vendorPass';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

const gql = vi.hoisted(() => ({ useVendorPortalMeQuery: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const ME = {
  vendorPortalMe: {
    name: 'Sam Supplier',
    email: 'sam@paper.test',
    supplierName: 'Paper Co',
    supplierCode: 'PAP',
  },
};
const refetch = vi.fn();

function answer(result: Readonly<{ data?: typeof ME; loading?: boolean; error?: unknown }>) {
  gql.useVendorPortalMeQuery.mockReturnValue({ loading: false, refetch, ...result });
}

function LoginUrl() {
  return <p data-testid="login-url">{useCurrentUrl()}</p>;
}

function renderGate() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginUrl />} />
      <Route
        path="*"
        element={
          <VendorGate>
            <p>Vendor content</p>
          </VendorGate>
        }
      />
    </Routes>,
    { route: '/orders?status=ORDERED' },
  );
}

const signedOutError = () =>
  new CombinedGraphQLErrors({
    errors: [{ message: 'Your access has ended', extensions: { code: 'UNAUTHENTICATED' } }],
  });

describe('VendorGate', () => {
  beforeEach(() => answer({}));
  afterEach(() => {
    vendorPass.clear();
    vi.clearAllMocks();
  });

  it('sends a visitor without a pass to sign in, remembering where they were going', async () => {
    renderGate();
    expect(await screen.findByTestId('login-url')).toHaveTextContent(
      '/login?next=%2Forders%3Fstatus%3DORDERED',
    );
    expect(gql.useVendorPortalMeQuery).toHaveBeenCalledWith({ skip: true });
    expect(screen.queryByText('Vendor content')).not.toBeInTheDocument();
  });

  it('shows a spinner while a pass is being checked', () => {
    vendorPass.store(`pass-${Date.now()}`);
    answer({ loading: true });
    renderGate();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(gql.useVendorPortalMeQuery).toHaveBeenCalledWith({ skip: false });
  });

  it('forgets a pass the server no longer honours and asks for a new sign-in', async () => {
    vendorPass.store(`pass-${Date.now()}`);
    answer({ error: signedOutError() });
    renderGate();
    expect(await screen.findByTestId('login-url')).toHaveTextContent('/login?next=');
    expect(vendorPass.has()).toBe(false);
  });

  it('keeps the pass on a network failure and offers a retry', async () => {
    vendorPass.store(`pass-${Date.now()}`);
    answer({ error: new Error('Failed to fetch') });
    renderGate();
    expect(
      screen.getByText(
        'The vendor portal could not be reached. Check your connection and try again.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(vendorPass.has()).toBe(true);
    expect(screen.queryByTestId('login-url')).not.toBeInTheDocument();
  });

  it('does not treat a GraphQL error other than UNAUTHENTICATED as a sign-out', () => {
    vendorPass.store(`pass-${Date.now()}`);
    answer({
      error: new CombinedGraphQLErrors({
        errors: [{ message: 'Boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
      }),
    });
    renderGate();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(vendorPass.has()).toBe(true);
  });

  it('offers a retry when the check answers with no contact at all', () => {
    vendorPass.store(`pass-${Date.now()}`);
    answer({ data: { vendorPortalMe: null } as never });
    renderGate();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByText('Vendor content')).not.toBeInTheDocument();
  });

  it('opens the portal to a contact whose pass checks out', () => {
    vendorPass.store(`pass-${Date.now()}`);
    answer({ data: ME });
    renderGate();
    expect(screen.getByText('Vendor content')).toBeInTheDocument();
  });
});
