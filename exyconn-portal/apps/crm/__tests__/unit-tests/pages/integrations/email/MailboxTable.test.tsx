import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GmailAccountStatus } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { MailboxTable } from '../../../../../src/pages/integrations/email/MailboxTable';
import type {
  MailboxActions,
  MailboxRow,
} from '../../../../../src/pages/integrations/email/mailboxes';
import { renderWithProviders } from '../../../test-utils';

const ROW: MailboxRow = {
  id: 'MICROSOFT:ms-1',
  account: { id: 'ms-1', email: 'ops@acme.io' },
  provider: 'MICROSOFT',
  email: 'ops@acme.io',
  enabled: false,
  status: GmailAccountStatus.Connected,
  lastError: '',
  lastErrorAt: null,
  connectedByName: 'Priya',
  lastActivityAt: null,
};
const SEND_FAILED =
  'Gmail /messages/send failed (403): {"error":{"code":403,"message":"Gmail API has not been used in project 42 before or it is disabled."}}';

function actions(overrides: Partial<MailboxActions> = {}): MailboxActions {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    connecting: false,
    test: vi.fn().mockResolvedValue(undefined),
    toggle: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderTable(row: MailboxRow, microsoft: MailboxActions, onViewDetails = vi.fn()) {
  renderWithProviders(
    <MailboxTable
      rows={[row]}
      loading={false}
      actions={{ GMAIL: actions(), MICROSOFT: microsoft }}
      onRefresh={vi.fn()}
      onViewDetails={onViewDetails}
    />,
  );
  return onViewDetails;
}

const press = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('MailboxTable', () => {
  it("routes a row's switch, Test, Reconnect and Disconnect to its own provider", async () => {
    const microsoft = actions();
    renderTable(ROW, microsoft);

    expect(screen.queryByRole('button', { name: 'View error details' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch', { name: 'Use ops@acme.io for CRM' }));
    await press('Test the mailbox');
    await press('Reconnect the mailbox');
    await press('Disconnect the mailbox');

    expect(microsoft.toggle).toHaveBeenCalledWith(ROW.account, true);
    expect(microsoft.test).toHaveBeenCalledWith(ROW.account);
    expect(microsoft.connect).toHaveBeenCalledWith('ops@acme.io');
    expect(microsoft.remove).toHaveBeenCalledWith(ROW.account);
  });

  it('names a failed send with the provider’s own reason, and opens its details', async () => {
    const onViewDetails = renderTable({ ...ROW, lastError: SEND_FAILED }, actions());

    const row = within(screen.getByText('ops@acme.io').closest('tr')!);
    expect(row.getByText('Send failed')).toBeInTheDocument();
    expect(
      row.getByText('Gmail API has not been used in project 42 before or it is disabled.'),
    ).toBeInTheDocument();
    await press('View error details');

    expect(onViewDetails).toHaveBeenCalledWith(expect.objectContaining({ id: ROW.id }));
  });

  it('puts a needed reconnect ahead of the error that caused it', () => {
    renderTable(
      { ...ROW, status: GmailAccountStatus.NeedsReconnect, lastError: 'Microsoft revoked access' },
      actions(),
    );

    const row = within(screen.getByText('ops@acme.io').closest('tr')!);
    expect(row.getByText('Needs reconnecting')).toBeInTheDocument();
    expect(row.getByText('Microsoft revoked access')).toBeInTheDocument();
  });

  it('logs each action that fails instead of leaving it unhandled', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('Network down');
    renderTable(
      ROW,
      actions({
        connect: vi.fn().mockRejectedValue(failure),
        test: vi.fn().mockRejectedValue(failure),
        toggle: vi.fn().mockRejectedValue(failure),
        remove: vi.fn().mockRejectedValue(failure),
      }),
    );

    await userEvent.click(screen.getByRole('switch', { name: 'Use ops@acme.io for CRM' }));
    await press('Test the mailbox');
    await press('Reconnect the mailbox');
    await press('Disconnect the mailbox');

    await waitFor(() => expect(warn).toHaveBeenCalledTimes(4));
    expect(warn).toHaveBeenCalledWith('crm: mailbox action failed', failure);
    warn.mockRestore();
  });
});
