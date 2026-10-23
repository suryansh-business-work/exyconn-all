import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GmailAccountStatus, useMyMailboxesQuery } from '@/graphql/generated';
import { closeDockPanel, DockHost } from '@/components/compose-dock';
import { openEmail } from '@/components/email';
import { renderWithProviders } from '../../test-utils';
import { mailboxesResult, myMailbox } from './mailboxFixtures';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useMyMailboxesQuery: vi.fn(),
  useSendMyEmailMutation: vi.fn(() => [vi.fn(), { loading: false }]),
}));

/** The form has its own tests; here it only shows what it was handed. */
vi.mock('@/components/email/forms/send-email', () => ({
  SendEmailForm: (
    props: Readonly<{
      draft: { to: string[] };
      mailboxes: { email: string }[];
      onDone: () => void;
    }>,
  ) => (
    <button type="button" onClick={props.onDone}>
      {`Form to ${props.draft.to.join()} from ${props.mailboxes.map((m) => m.email).join()}`}
    </button>
  ),
}));

const queryReturns = (result: ReturnType<typeof mailboxesResult>) =>
  vi
    .mocked(useMyMailboxesQuery)
    .mockReturnValue(result as unknown as ReturnType<typeof useMyMailboxesQuery>);

function openTo(address: string) {
  renderWithProviders(<DockHost />);
  act(() => openEmail({ to: [address] }));
}

describe('the email window', () => {
  beforeEach(() => {
    queryReturns(mailboxesResult([myMailbox()]));
  });

  afterEach(() => {
    closeDockPanel('email:ada@acme.io');
  });

  it('opens over the page addressed to the person, sending from a working mailbox', async () => {
    queryReturns(
      mailboxesResult([
        myMailbox(),
        myMailbox({ id: 'm2', email: 'old@acme.io', status: GmailAccountStatus.NeedsReconnect }),
      ]),
    );
    openTo('ada@acme.io');

    expect(screen.getByRole('dialog', { name: 'Email · ada@acme.io' })).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Form to ada@acme.io from me@acme.io' }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('waits for the mailboxes, then offers a retry when they fail to load', async () => {
    queryReturns({ ...mailboxesResult([], { loading: true }), data: undefined } as never);
    openTo('ada@acme.io');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    const failed = mailboxesResult([], { error: new Error('down') });
    queryReturns(failed);
    act(() => openEmail({ to: ['ada@acme.io'] }));
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Your mailboxes could not be loaded.')).toBeInTheDocument();
    expect(failed.refetch).toHaveBeenCalled();
  });

  it('explains how to connect a mailbox when the person has none that can send', () => {
    queryReturns(mailboxesResult([myMailbox({ status: GmailAccountStatus.NeedsReconnect })]));
    openTo('ada@acme.io');

    expect(screen.getByText(/Connect your own Gmail or Microsoft mailbox/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect Gmail' })).toBeInTheDocument();
  });
});
