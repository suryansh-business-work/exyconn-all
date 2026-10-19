import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GmailAccountStatus } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  MailboxCard,
  type Mailbox,
  type MailboxActions,
} from '../../../src/integrations/MailboxCard';
import { renderWithProviders } from '../test-utils';

const ACCOUNT: Mailbox = {
  id: 'mb-1',
  email: 'sales@acme.example',
  enabled: true,
  status: GmailAccountStatus.Connected,
  lastError: '',
  connectedByName: 'Grace Hopper',
};

function actions(overrides: Partial<MailboxActions<Mailbox>> = {}): MailboxActions<Mailbox> {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    connecting: false,
    toggle: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderCard(account: Mailbox = ACCOUNT, mailboxActions = actions(), heading?: 'h2' | 'h3') {
  renderWithProviders(
    <MailboxCard
      account={account}
      actions={mailboxActions}
      activity="Last synced: 3 Oct, 10:00"
      heading={heading}
    />,
  );
  return mailboxActions;
}

describe('MailboxCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a healthy mailbox: address heading, Connected, its activity and who connected it', () => {
    renderCard();

    expect(screen.getByRole('article', { name: 'sales@acme.example' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'sales@acme.example' })).toBeVisible();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(
      screen.getByText('Last synced: 3 Oct, 10:00 · Connected by Grace Hopper'),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Use for CRM' })).toBeChecked();
    expect(screen.queryByRole('button', { name: 'Reconnect' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses an h3 inside another section and leaves out an unknown connector', () => {
    renderCard({ ...ACCOUNT, connectedByName: '' }, actions(), 'h3');

    expect(screen.getByRole('heading', { level: 3, name: 'sales@acme.example' })).toBeVisible();
    expect(screen.getByText('Last synced: 3 Oct, 10:00')).toBeInTheDocument();
  });

  it('shows the last error as information on a working mailbox', () => {
    renderCard({ ...ACCOUNT, lastError: 'One message could not be filed' });

    expect(screen.getByRole('alert')).toHaveTextContent('One message could not be filed');
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorInfo');
  });

  it('asks to reconnect a rejected mailbox and reconnects it', async () => {
    const mailboxActions = renderCard({
      ...ACCOUNT,
      status: GmailAccountStatus.NeedsReconnect,
      lastError: 'Google revoked access',
    });

    expect(screen.getByText('Needs reconnecting')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorWarning');
    await userEvent.click(screen.getByRole('button', { name: 'Reconnect' }));

    expect(mailboxActions.connect).toHaveBeenCalledTimes(1);
  });

  it('switches CRM use off and on, and disconnects', async () => {
    const mailboxActions = renderCard();

    await userEvent.click(screen.getByRole('switch', { name: 'Use for CRM' }));
    await userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(mailboxActions.toggle).toHaveBeenCalledWith(ACCOUNT, false);
    expect(mailboxActions.remove).toHaveBeenCalledWith(ACCOUNT);
  });

  it('logs each action that fails instead of leaving it unhandled', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('Network down');
    renderCard(
      { ...ACCOUNT, enabled: false, status: GmailAccountStatus.NeedsReconnect },
      actions({
        connect: vi.fn().mockRejectedValue(failure),
        toggle: vi.fn().mockRejectedValue(failure),
        remove: vi.fn().mockRejectedValue(failure),
      }),
    );

    await userEvent.click(screen.getByRole('switch', { name: 'Use for CRM' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reconnect' }));
    await userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(warn).toHaveBeenCalledTimes(3));
    expect(warn).toHaveBeenCalledWith('crm: mailbox action failed', failure);
  });
});
