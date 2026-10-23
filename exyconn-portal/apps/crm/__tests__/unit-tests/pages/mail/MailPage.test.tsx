import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmMailAction, CrmMailFolder } from '@exyconn/shell/graphql/generated';
import { MailPage } from '../../../../src/pages/mail';
import { renderWithProviders } from '../../test-utils';
import { mailbox, row, thread } from './mail-fixtures';

const gql = vi.hoisted(() => ({
  overview: vi.fn(),
  threads: vi.fn(),
  thread: vi.fn(),
  sync: vi.fn(),
  action: vi.fn(),
}));
const compose = vi.hoisted(() => ({ contexts: [] as unknown[] }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmMailOverviewQuery: (options: unknown) => gql.overview(options),
  useCrmMailThreadsQuery: (options: unknown) => gql.threads(options),
  useCrmMailThreadQuery: (options: unknown) => gql.thread(options),
  useSyncCrmMailMutation: () => [gql.sync, { loading: false, data: undefined }],
  useCrmMailThreadActionMutation: () => [gql.action, { loading: false }],
}));

/** The shared compose form is tested on its own; here only what it is handed matters. */
vi.mock('../../../../src/records/detail/forms/compose-email', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/records/detail/forms/compose-email')>()),
  ComposeEmailForm: ({ context }: { context: unknown }) => {
    compose.contexts.push(context);
    return <p>compose form</p>;
  },
}));

const counts = [
  { folder: CrmMailFolder.Inbox, unread: 3 },
  { folder: CrmMailFolder.Sent, unread: 0 },
  { folder: CrmMailFolder.Starred, unread: 0 },
  { folder: CrmMailFolder.All, unread: 3 },
];
const overviewWith = (mailboxes: unknown[]) => ({
  data: { crmMailOverview: { mailboxes, folders: counts } },
  refetch: vi.fn(),
});

describe('MailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    compose.contexts = [];
    gql.sync.mockResolvedValue({});
    gql.action.mockResolvedValue({ data: { crmMailThreadAction: 1 } });
    gql.overview.mockReturnValue(overviewWith([mailbox()]));
    gql.threads.mockReturnValue({
      data: { crmMailThreads: { rows: [row()], totalCount: 1, warnings: [] } },
      refetch: vi.fn(),
    });
    gql.thread.mockReturnValue({ data: { crmMailThread: thread() }, refetch: vi.fn() });
  });

  it('points to Integrations when no mailbox can be read, and syncs nothing', async () => {
    gql.overview.mockReturnValue(
      overviewWith([mailbox({ provider: 'MICROSOFT' as never, readable: false })]),
    );
    renderWithProviders(<MailPage />, { route: '/mail', path: '/mail/:folder?' });

    expect(screen.getByText(/connected to send email only/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect a mailbox' })).toBeInTheDocument();
    expect(gql.sync).not.toHaveBeenCalled();
  });

  it('syncs on opening and lists the inbox page with its record and unread count', async () => {
    renderWithProviders(<MailPage />, { route: '/mail/inbox', path: '/mail/:folder?' });

    await waitFor(() => expect(gql.sync).toHaveBeenCalledWith({ variables: { accountId: null } }));
    expect(gql.threads).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            accountId: null,
            folder: CrmMailFolder.Inbox,
            search: null,
            page: 0,
            pageSize: 25,
          },
        },
      }),
    );
    expect(screen.getByText('Asha (2)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Asha Kumar' })).toHaveAttribute(
      'href',
      '/contacts/c1',
    );
    expect(screen.getByText('1–1 of 1')).toBeInTheDocument();
  });

  it('asks before moving the selected conversations to trash', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MailPage />, { route: '/mail/inbox', path: '/mail/:folder?' });

    await user.click(screen.getByRole('checkbox', { name: 'Select "Pricing"' }));
    await user.click(screen.getByRole('button', { name: 'Move to trash' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Move to trash' }));

    await waitFor(() =>
      expect(gql.action).toHaveBeenCalledWith({
        variables: { threads: [{ accountId: 'g1', threadId: 't1' }], action: CrmMailAction.Trash },
      }),
    );
  });

  it('opens the conversation, marks it read, and replies in its thread', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MailPage />, {
      route: '/mail/inbox?thread=g1:t1',
      path: '/mail/:folder?',
    });

    expect(gql.thread).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { accountId: 'g1', threadId: 't1' } }),
    );
    await waitFor(() =>
      expect(gql.action).toHaveBeenCalledWith({
        variables: {
          threads: [{ accountId: 'g1', threadId: 't1' }],
          action: CrmMailAction.MarkRead,
        },
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Reply all' }));

    expect(screen.getByText('compose form')).toBeInTheDocument();
    expect(compose.contexts.at(-1)).toMatchObject({
      to: ['asha@globex.io'],
      cc: ['ops@globex.io'],
      threadId: 't1',
      fromAccountId: 'g1',
    });
  });
});
