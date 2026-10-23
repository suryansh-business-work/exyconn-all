import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { GmailAccountStatus } from '@/graphql/generated';
import { MailboxStatus } from '@/components/mailboxes';
import { renderWithProviders } from '../../test-utils';

const SEND_FAILED = 'Gmail /messages/send failed (403): {"error":{"message":"Quota exceeded"}}';

describe('MailboxStatus', () => {
  it('reads Connected for a working mailbox', () => {
    renderWithProviders(
      <MailboxStatus row={{ status: GmailAccountStatus.Connected, lastError: '' }} />,
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('names the failed call with the provider reason under it', () => {
    renderWithProviders(
      <MailboxStatus row={{ status: GmailAccountStatus.Connected, lastError: SEND_FAILED }} />,
    );

    expect(screen.getByText('Send failed')).toBeInTheDocument();
    expect(screen.getByText('Quota exceeded')).toHaveAttribute('title', 'Quota exceeded');
  });

  it('asks for a reconnect first, with or without a reason', () => {
    renderWithProviders(
      <>
        <MailboxStatus
          row={{ status: GmailAccountStatus.NeedsReconnect, lastError: SEND_FAILED }}
        />
        <MailboxStatus row={{ status: GmailAccountStatus.NeedsReconnect, lastError: '' }} />
      </>,
    );

    expect(screen.getAllByText('Needs reconnecting')).toHaveLength(2);
    expect(screen.getAllByText('Quota exceeded')).toHaveLength(1);
  });
});
