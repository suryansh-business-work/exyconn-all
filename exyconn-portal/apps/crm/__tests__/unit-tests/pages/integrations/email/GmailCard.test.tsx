import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { GmailCard } from '../../../../../src/pages/integrations/email/GmailCard';
import { renderWithProviders } from '../../../test-utils';
import { gmailAccount } from '../integration-fixtures';
import { describeMailProviderCard } from './mail-provider-card.suite';

const gql = vi.hoisted(() => ({ accounts: vi.fn() }));
const actions = vi.hoisted(() => ({
  connect: vi.fn(),
  connecting: false,
  toggle: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGmailAccountsQuery: (options: unknown) => gql.accounts(options),
}));
vi.mock('../../../../../src/pages/integrations/email/useGmailAccountActions', () => ({
  useGmailAccountActions: () => actions,
}));

describeMailProviderCard({
  name: 'GmailCard',
  render: (ready) => <GmailCard ready={ready} />,
  query: gql.accounts,
  listKey: 'gmailAccounts',
  readyKey: 'gmailClientReady',
  account: gmailAccount(),
  actions,
  title: 'Gmail',
  connectLabel: 'Connect Gmail account',
  empty: 'No Gmail account connected yet.',
  loading: 'Loading the Gmail accounts',
});

describe('GmailCard accounts', () => {
  it('says when each account last synced', () => {
    gql.accounts.mockReturnValue({
      data: {
        gmailAccounts: [
          gmailAccount(),
          gmailAccount({ id: 'g2', email: 'ops@acme.io', lastSyncAt: '2026-10-02T09:30:00Z' }),
        ],
        gmailClientReady: true,
      },
      loading: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<GmailCard ready />);

    const never = within(screen.getByRole('article', { name: 'sales@acme.io' }));
    expect(never.getByText(/Last synced: Never/)).toBeInTheDocument();
    const synced = within(screen.getByRole('article', { name: 'ops@acme.io' }));
    expect(synced.getByText(/Last synced: /)).not.toHaveTextContent('Never');
  });
});
