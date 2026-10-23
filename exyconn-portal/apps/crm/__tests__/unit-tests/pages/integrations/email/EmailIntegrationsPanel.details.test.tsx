import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailIntegrationsPanel } from '../../../../../src/pages/integrations/email/EmailIntegrationsPanel';
import { renderWithProviders } from '../../../test-utils';
import { gmailAccount } from '../integration-fixtures';

const gql = vi.hoisted(() => ({ gmail: vi.fn(), microsoft: vi.fn() }));
const actions = vi.hoisted(() => ({
  connect: vi.fn(),
  connecting: false,
  test: vi.fn(),
  toggle: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGmailAccountsQuery: () => gql.gmail(),
  useMicrosoftMailAccountsQuery: () => gql.microsoft(),
}));
vi.mock('../../../../../src/pages/integrations/email/useGmailAccountActions', () => ({
  useGmailAccountActions: () => actions,
}));
vi.mock('../../../../../src/pages/integrations/email/useMicrosoftMailActions', () => ({
  useMicrosoftMailActions: () => actions,
}));

const FAILED = 'Gmail /messages/send failed (403): {"error":{"message":"Gmail API is disabled."}}';

describe('EmailIntegrationsPanel error details', () => {
  it('opens the failing mailbox’s details and closes them again', async () => {
    gql.gmail.mockReturnValue({
      data: {
        gmailAccounts: [gmailAccount({ lastError: FAILED, lastErrorAt: '2026-10-02T09:30:00Z' })],
        gmailClientReady: true,
      },
      loading: false,
      refetch: vi.fn(),
    });
    gql.microsoft.mockReturnValue({
      data: { microsoftMailAccounts: [], microsoftMailClientReady: true },
      loading: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<EmailIntegrationsPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'View error details' }));
    const dialog = await screen.findByRole('dialog', { name: 'Error details' });
    expect(dialog).toHaveTextContent('Gmail API is disabled.');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
