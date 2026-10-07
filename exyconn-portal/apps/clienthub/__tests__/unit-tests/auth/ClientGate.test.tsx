import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ClientGate } from '../../../src/auth/ClientGate';
import { clientPass } from '../../../src/auth/clientPass';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

const gql = vi.hoisted(() => ({ useClientHubMeQuery: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const ME = {
  clientHubMe: {
    name: 'Ada Lovelace',
    email: 'ada@acme.com',
    clientName: 'Acme',
    company: 'Acme Ltd',
  },
};
const refetch = vi.fn();

function answer(result: Readonly<{ data?: typeof ME; loading?: boolean; error?: unknown }>) {
  gql.useClientHubMeQuery.mockReturnValue({ loading: false, refetch, ...result });
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
          <ClientGate>
            <p>Hub content</p>
          </ClientGate>
        }
      />
    </Routes>,
    { route: '/invoices?pay=inv-1' },
  );
}

const signedOutError = () =>
  new CombinedGraphQLErrors({
    errors: [{ message: 'Your access has ended', extensions: { code: 'UNAUTHENTICATED' } }],
  });

describe('ClientGate', () => {
  beforeEach(() => answer({}));
  afterEach(() => {
    clientPass.clear();
    vi.clearAllMocks();
  });

  it('sends a visitor without a pass to sign in, remembering where they were going', async () => {
    renderGate();
    expect(await screen.findByTestId('login-url')).toHaveTextContent(
      '/login?next=%2Finvoices%3Fpay%3Dinv-1',
    );
    expect(gql.useClientHubMeQuery).toHaveBeenCalledWith({ skip: true });
    expect(screen.queryByText('Hub content')).not.toBeInTheDocument();
  });

  it('shows a spinner while a pass is being checked', () => {
    clientPass.store(`pass-${Date.now()}`);
    answer({ loading: true });
    renderGate();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(gql.useClientHubMeQuery).toHaveBeenCalledWith({ skip: false });
  });

  it('forgets a pass the server no longer honours and asks for a new sign-in', async () => {
    clientPass.store(`pass-${Date.now()}`);
    answer({ error: signedOutError() });
    renderGate();
    expect(await screen.findByTestId('login-url')).toHaveTextContent('/login?next=');
    expect(clientPass.has()).toBe(false);
  });

  it('keeps the pass on a network failure and offers a retry', async () => {
    clientPass.store(`pass-${Date.now()}`);
    answer({ error: new Error('Failed to fetch') });
    renderGate();
    expect(
      screen.getByText('The client hub could not be reached. Check your connection and try again.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(clientPass.has()).toBe(true);
    expect(screen.queryByTestId('login-url')).not.toBeInTheDocument();
  });

  it('does not treat a GraphQL error other than UNAUTHENTICATED as a sign-out', () => {
    clientPass.store(`pass-${Date.now()}`);
    answer({
      error: new CombinedGraphQLErrors({
        errors: [{ message: 'Boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
      }),
    });
    renderGate();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(clientPass.has()).toBe(true);
  });

  it('opens the hub to a contact whose pass checks out', () => {
    clientPass.store(`pass-${Date.now()}`);
    answer({ data: ME });
    renderGate();
    expect(screen.getByText('Hub content')).toBeInTheDocument();
  });
});
