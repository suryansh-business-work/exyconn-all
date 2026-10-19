import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { GmailAccountStatus } from '@exyconn/shell/graphql/generated';
import { ReconnectNotice } from '../../../../../src/records/detail/email/ReconnectNotice';
import { renderWithProviders } from '../../../test-utils';
import { gmailAccount } from '../../../pages/integrations/integration-fixtures';

const gql = vi.hoisted(() => ({ accounts: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGmailAccountsQuery: (options: unknown) => gql.accounts(options),
}));

describe('ReconnectNotice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('names the refused accounts and sends the user to Integrations to reconnect them', () => {
    gql.accounts.mockReturnValue({
      data: {
        gmailAccounts: [
          gmailAccount({ status: GmailAccountStatus.NeedsReconnect }),
          gmailAccount({ id: 'g2', email: 'ops@acme.io' }),
          gmailAccount({
            id: 'g3',
            email: 'old@acme.io',
            enabled: false,
            status: GmailAccountStatus.NeedsReconnect,
          }),
        ],
      },
    });
    renderWithProviders(<ReconnectNotice />);

    expect(gql.accounts).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'These Gmail accounts need reconnecting, so their newest mail is missing: sales@acme.io.',
    );
    expect(screen.getByRole('link', { name: 'Reconnect in Integrations' })).toHaveAttribute(
      'href',
      '/integrations/email',
    );
  });

  it('says nothing while every enabled account is connected', () => {
    gql.accounts.mockReturnValue({ data: { gmailAccounts: [gmailAccount()] } });
    renderWithProviders(<ReconnectNotice />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
