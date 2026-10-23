import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { MailboxConnectReturn } from '@/components/email';
import { renderWithProviders } from '../../test-utils';

function Address() {
  const { pathname, search, hash } = useLocation();
  return <output>{`${pathname}${search}${hash}`}</output>;
}

const renderAt = (route: string) =>
  renderWithProviders(
    <>
      <MailboxConnectReturn />
      <Address />
    </>,
    { route },
  );

describe('MailboxConnectReturn', () => {
  it('announces the connected mailbox and tidies the address, keeping the rest', async () => {
    renderAt('/settings?tab=a&myMailbox=1&gmailConnected=me@acme.io#top');

    expect(
      await screen.findByText('Connected me@acme.io. Email you send goes out from it.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('/settings?tab=a#top');
  });

  it('announces a refusal and leaves a bare address', async () => {
    renderAt('/people?myMailbox=1&microsoftError=Cancelled');

    expect(await screen.findByText('The mailbox was not connected: Cancelled')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/^\/people$/);
  });

  it('leaves a CRM connect to the CRM', () => {
    renderAt('/integrations?gmailConnected=sales@acme.io');

    expect(screen.getByRole('status')).toHaveTextContent(
      '/integrations?gmailConnected=sales@acme.io',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
