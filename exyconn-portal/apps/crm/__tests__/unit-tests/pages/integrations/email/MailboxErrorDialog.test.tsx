import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GmailAccountStatus } from '@exyconn/shell/graphql/generated';
import { MailboxErrorDialog } from '../../../../../src/pages/integrations/email/MailboxErrorDialog';
import type { MailboxRow } from '../../../../../src/pages/integrations/email/mailboxes';
import { renderWithProviders } from '../../../test-utils';

const CONSOLE =
  'https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=7';
const ERROR = `Gmail /messages/send failed (403): {"error":{"message":"Gmail API has not been used in project 7 before or it is disabled. Enable it by visiting ${CONSOLE} then retry."}}`;
const ROW: MailboxRow = {
  id: 'GMAIL:g1',
  account: { id: 'g1', email: 'hr@acme.io' },
  provider: 'GMAIL',
  email: 'hr@acme.io',
  enabled: true,
  status: GmailAccountStatus.Connected,
  lastError: ERROR,
  lastErrorAt: '2026-10-02T09:30:00Z',
  connectedByName: 'Priya',
  lastActivityAt: null,
};

function renderDialog(row: MailboxRow | null) {
  const onClose = vi.fn();
  renderWithProviders(<MailboxErrorDialog row={row} onClose={onClose} />);
  return onClose;
}

describe('MailboxErrorDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the whole error, when it happened, and how to fix it with Google’s own link', () => {
    renderDialog(ROW);

    const dialog = screen.getByRole('dialog', { name: 'Error details' });
    expect(dialog).toHaveTextContent('hr@acme.io ·');
    expect(screen.getByRole('region', { name: 'Full error' })).toHaveTextContent(
      'Gmail API has not been used in project 7 before or it is disabled.',
    );
    expect(screen.getByText('How to fix')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: CONSOLE })).toHaveAttribute('href', CONSOLE);
  });

  it('copies the error as stored and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderDialog(ROW);

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith(ERROR);
    expect(await screen.findByText('Error copied')).toBeInTheDocument();
  });

  it('says when the browser blocks the clipboard', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderDialog(ROW);

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(
      await screen.findByText('Could not copy: your browser blocked the clipboard'),
    ).toBeInTheDocument();
  });

  it('leaves out the fix and the time for an unknown, undated error, and closes', async () => {
    const onClose = renderDialog({
      ...ROW,
      lastError: 'Gmail /threads failed (500): busy',
      lastErrorAt: null,
    });

    expect(screen.queryByText('How to fix')).not.toBeInTheDocument();
    expect(screen.getByText('hr@acme.io')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('stays closed without a mailbox', () => {
    renderDialog(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
