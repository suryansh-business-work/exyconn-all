import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { MicrosoftMailCard } from '../../../../../src/pages/integrations/email/MicrosoftMailCard';
import { renderWithProviders } from '../../../test-utils';
import { microsoftAccount } from '../integration-fixtures';
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
  useMicrosoftMailAccountsQuery: (options: unknown) => gql.accounts(options),
}));
vi.mock('../../../../../src/pages/integrations/email/useMicrosoftMailActions', () => ({
  useMicrosoftMailActions: () => actions,
}));

describeMailProviderCard({
  name: 'MicrosoftMailCard',
  render: (ready) => <MicrosoftMailCard ready={ready} />,
  query: gql.accounts,
  listKey: 'microsoftMailAccounts',
  readyKey: 'microsoftMailClientReady',
  account: microsoftAccount(),
  actions,
  title: 'Microsoft (Outlook / Microsoft 365)',
  connectLabel: 'Connect Microsoft account',
  empty: 'No Microsoft mailbox connected yet.',
  loading: 'Loading the Microsoft mailboxes',
  unavailable:
    'Microsoft mailbox connections are not switched on yet. Ask your platform administrator to set them up in Tech > Environment Variables > Email accounts (OAuth).',
});

describe('MicrosoftMailCard mailboxes', () => {
  it('says when each mailbox was last used', () => {
    gql.accounts.mockReturnValue({
      data: {
        microsoftMailAccounts: [
          microsoftAccount(),
          microsoftAccount({
            id: 'ms-2',
            email: 'ops@acme.io',
            lastUsedAt: '2026-10-02T09:30:00Z',
          }),
        ],
        microsoftMailClientReady: true,
      },
      loading: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<MicrosoftMailCard ready />);

    const never = within(screen.getByRole('article', { name: 'sales@acme.io' }));
    expect(never.getByText(/Last used: Never/)).toBeInTheDocument();
    const used = within(screen.getByRole('article', { name: 'ops@acme.io' }));
    expect(used.getByText(/Last used: /)).not.toHaveTextContent('Never');
  });
});
