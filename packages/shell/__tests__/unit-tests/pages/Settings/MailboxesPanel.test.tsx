import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CrmEmailProvider,
  GmailAccountStatus,
  useDisconnectMyMailboxMutation,
  useMyMailboxesQuery,
  useSetDefaultMyMailboxMutation,
  useStartMyMailboxConnectMutation,
  useTestMyMailboxMutation,
} from '@/graphql/generated';
import { MailboxesPanel } from '@/pages/Settings/mailboxes/MailboxesPanel';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple } from '../hookMocks';
import { mailboxesResult, myMailbox } from '../../components/email/mailboxFixtures';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useMyMailboxesQuery: vi.fn(),
  useTestMyMailboxMutation: vi.fn(),
  useSetDefaultMyMailboxMutation: vi.fn(),
  useDisconnectMyMailboxMutation: vi.fn(),
  useStartMyMailboxConnectMutation: vi.fn(),
}));

const testMailbox = vi.fn();
const setDefault = vi.fn();
const disconnect = vi.fn();
const start = vi.fn();
const REFUSED = 'Gmail /profile failed (401): {"error":{"message":"Token revoked"}}';
const WORKING = myMailbox();
const BROKEN = myMailbox({
  id: 'm2',
  email: 'old@outlook.com',
  provider: CrmEmailProvider.Microsoft,
  status: GmailAccountStatus.NeedsReconnect,
  lastError: REFUSED,
  isDefault: false,
});

const asHook = <T,>(value: unknown) => value as T;

function mailboxesAre(result: unknown) {
  vi.mocked(useMyMailboxesQuery).mockReturnValue(
    asHook<ReturnType<typeof useMyMailboxesQuery>>(result),
  );
}

const rowOf = (email: string) =>
  within(screen.getByRole('list', { name: 'Your mailboxes' }))
    .getByText(email)
    .closest('li') as HTMLElement;

describe('MailboxesPanel', () => {
  beforeEach(() => {
    mailboxesAre(mailboxesResult([WORKING, BROKEN]));
    vi.mocked(useTestMyMailboxMutation).mockReturnValue(asHook(mutationTuple(testMailbox)));
    vi.mocked(useSetDefaultMyMailboxMutation).mockReturnValue(asHook(mutationTuple(setDefault)));
    vi.mocked(useDisconnectMyMailboxMutation).mockReturnValue(asHook(mutationTuple(disconnect)));
    vi.mocked(useStartMyMailboxConnectMutation).mockReturnValue(asHook(mutationTuple(start)));
  });

  afterEach(() => {
    for (const mock of [testMailbox, setDefault, disconnect, start]) {
      mock.mockReset();
    }
  });

  it('waits for the mailboxes, then offers a retry when they fail to load', async () => {
    mailboxesAre({ ...mailboxesResult([], { loading: true }), data: undefined });
    const { unmount } = renderWithProviders(<MailboxesPanel />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    unmount();

    const failed = mailboxesResult([], { error: new Error('down') });
    mailboxesAre(failed);
    renderWithProviders(<MailboxesPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Your mailboxes could not be loaded.')).toBeInTheDocument();
    expect(failed.refetch).toHaveBeenCalled();
  });

  it('says none is connected yet and offers both providers', () => {
    mailboxesAre(mailboxesResult([]));
    renderWithProviders(<MailboxesPanel />);

    expect(screen.getByText('No mailbox connected yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect Gmail' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect Microsoft' })).toBeInTheDocument();
  });

  it('lists each mailbox with its provider, state and the actions that fit it', () => {
    renderWithProviders(<MailboxesPanel />);

    const working = rowOf('me@acme.io');
    expect(within(working).getByText('Default')).toBeInTheDocument();
    expect(within(working).getByText('Connected')).toBeInTheDocument();
    expect(within(working).queryByRole('button', { name: 'Make default' })).toBeNull();
    const broken = rowOf('old@outlook.com');
    expect(within(broken).getByText('Microsoft')).toBeInTheDocument();
    expect(within(broken).getByText('Needs reconnecting')).toBeInTheDocument();
    expect(within(broken).queryByRole('button', { name: 'Test' })).toBeNull();
  });

  it('tests a mailbox and says whether it answered', async () => {
    testMailbox.mockResolvedValueOnce({ data: { testMyMailbox: { lastError: '' } } });
    testMailbox.mockResolvedValueOnce({ data: { testMyMailbox: { lastError: REFUSED } } });
    renderWithProviders(<MailboxesPanel />);
    const test = within(rowOf('me@acme.io')).getByRole('button', { name: 'Test' });

    await userEvent.click(test);
    expect(await screen.findByText('me@acme.io works.')).toBeInTheDocument();
    await userEvent.click(test);
    expect(
      await screen.findByText('me@acme.io did not answer. See the details.'),
    ).toBeInTheDocument();
    expect(testMailbox).toHaveBeenCalledWith({ variables: { id: 'm1' } });
  });

  it('makes a mailbox the default, and says so when that fails', async () => {
    setDefault.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Not yours'));
    renderWithProviders(<MailboxesPanel />);
    const makeDefault = within(rowOf('old@outlook.com')).getByRole('button', {
      name: 'Make default',
    });

    await userEvent.click(makeDefault);
    expect(await screen.findByText('New email now goes from old@outlook.com.')).toBeInTheDocument();
    await userEvent.click(makeDefault);
    expect(await screen.findByText('Not yours')).toBeInTheDocument();
  });

  it('reconnects a broken mailbox as that same account, and shows its error in full', async () => {
    start.mockResolvedValue({ data: { startMyMailboxConnect: '' } });
    renderWithProviders(<MailboxesPanel />);
    const broken = rowOf('old@outlook.com');

    await userEvent.click(within(broken).getByRole('button', { name: 'Reconnect' }));
    expect(start).toHaveBeenCalledWith({
      variables: expect.objectContaining({
        provider: CrmEmailProvider.Microsoft,
        loginHint: 'old@outlook.com',
      }),
    });

    await userEvent.click(within(broken).getByRole('button', { name: 'View details' }));
    const dialog = screen.getByRole('dialog', { name: 'Error details' });
    expect(within(dialog).getByText(/Token revoked/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('disconnects only after the person confirms', async () => {
    disconnect.mockResolvedValue({});
    renderWithProviders(<MailboxesPanel />);
    const remove = within(rowOf('me@acme.io')).getByRole('button', { name: 'Disconnect' });

    await userEvent.click(remove);
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(disconnect).not.toHaveBeenCalled();

    await userEvent.click(remove);
    const confirm = await screen.findByRole('dialog', { name: 'Disconnect this mailbox?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Disconnect' }));

    expect(await screen.findByText('Disconnected me@acme.io.')).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalledWith({ variables: { id: 'm1' } });
  });
});
