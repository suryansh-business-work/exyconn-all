import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CrmEmailDirection,
  CrmEmailThreadSort,
  CrmTimelineObject,
} from '@exyconn/shell/graphql/generated';
import { EmailThreads } from '../../../../../src/records/detail/email/EmailThreads';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ page: vi.fn(), sync: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmEmailThreadPageQuery: (options: unknown) => gql.page(options),
  useSyncCrmEmailsMutation: () => [gql.sync, { loading: false }],
  useGmailAccountsQuery: () => ({ data: { gmailAccounts: [] } }),
}));

vi.mock('../../../../../src/records/detail/forms/compose-email', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ComposeEmailForm: ({ context }: { context: { to: string[]; subject?: string } }) => (
    <p>{`compose to ${context.to.join(',')} ${context.subject ?? ''}`}</p>
  ),
}));

const message = (id: string, direction: CrmEmailDirection, body: string) => ({
  __typename: 'CrmEmailMessage' as const,
  id,
  messageId: `<${id}@mail>`,
  direction,
  from: direction === CrmEmailDirection.In ? 'asha@acme.test' : 'sales@exyconn.test',
  to: ['someone@acme.test'],
  cc: [],
  subject: 'Pricing',
  snippet: body.slice(0, 20),
  bodyText: body,
  sentAt: '2026-10-20T10:00:00.000Z',
  sentByName: direction === CrmEmailDirection.Out ? 'Ravi' : '',
  accountId: 'acc-1',
  mailbox: 'sales@exyconn.test',
});

const thread = {
  __typename: 'CrmEmailThread' as const,
  threadId: 't1',
  accountId: 'acc-1',
  mailbox: 'sales@exyconn.test',
  subject: 'Pricing',
  lastAt: '2026-10-20T10:00:00.000Z',
  messages: [
    message('m1', CrmEmailDirection.Out, 'Here is our pricing.'),
    message(
      'm2',
      CrmEmailDirection.In,
      'Looks good.\n\nOn Mon, Ravi wrote:\n> Here is our pricing.',
    ),
  ],
};

const pageOf = (rows: (typeof thread)[], totalCount = rows.length) => ({
  data: {
    crmEmailThreadPage: {
      totalCount,
      rows,
      mailboxes: [{ accountId: 'acc-1', mailbox: 'sales@exyconn.test' }],
    },
  },
  refetch: gql.refetch,
});

const lastInput = () => gql.page.mock.lastCall?.[0].variables.input;

const renderTab = () =>
  renderWithProviders(
    <EmailThreads object={CrmTimelineObject.Contact} id="c1" defaultTo={['asha@acme.test']} />,
  );

describe('EmailThreads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.sync.mockResolvedValue({});
    gql.refetch.mockResolvedValue({});
    gql.page.mockReturnValue(pageOf([thread], 30));
  });

  it('syncs Gmail on open, then lists the conversations newest first, ten to a page', async () => {
    renderTab();

    await waitFor(() => expect(gql.refetch).toHaveBeenCalled());
    expect(gql.sync).toHaveBeenCalledWith({ variables: { object: 'CONTACT', id: 'c1' } });
    expect(lastInput()).toMatchObject({ sort: CrmEmailThreadSort.Newest, page: 0, pageSize: 10 });
    expect(screen.getByRole('button', { name: /Pricing.*2 messages/ })).toBeInTheDocument();
    expect(screen.getByText('1–10 of 30')).toBeInTheDocument();
  });

  it('pages, sorts and filters on the server, starting again from the first page', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(lastInput()).toMatchObject({ page: 1 });

    await user.click(screen.getByRole('combobox', { name: 'Sort' }));
    await user.click(screen.getByRole('option', { name: 'Subject A–Z' }));
    expect(lastInput()).toMatchObject({ sort: CrmEmailThreadSort.Subject, page: 0 });

    await user.click(screen.getByRole('button', { name: 'Filters (0 active)' }));
    const panel = screen.getByRole('presentation');
    await user.click(within(panel).getByRole('combobox', { name: /^Direction/ }));
    await user.click(screen.getByRole('option', { name: 'Received' }));
    await user.click(within(panel).getByRole('button', { name: 'Apply filters' }));

    await waitFor(() => expect(lastInput()).toMatchObject({ direction: 'IN', page: 0 }));
    expect(await screen.findByRole('button', { name: 'Filters (1 active)' })).toBeInTheDocument();
  });

  it('opens a conversation with every message at one level and the quote folded away', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: /Pricing.*2 messages/ }));

    expect(screen.getByRole('heading', { name: 'Pricing' })).toBeInTheDocument();
    const messages = screen.getAllByRole('listitem');
    expect(messages).toHaveLength(2);
    expect(within(messages[1]).getByText('Looks good.')).toBeVisible();
    expect(within(messages[1]).queryByText(/Ravi wrote/)).not.toBeInTheDocument();
    await user.click(within(messages[1]).getByRole('button', { name: 'Show quoted text' }));
    expect(within(messages[1]).getByText(/Ravi wrote/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reply' }));
    expect(screen.getByText('compose to asha@acme.test Re: Pricing')).toBeInTheDocument();
  });

  it('goes back to the list from a conversation', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: /Pricing.*2 messages/ }));
    await user.click(screen.getByRole('button', { name: 'Back to all emails' }));

    expect(screen.getByRole('list', { name: 'Emails' })).toBeInTheDocument();
  });

  it('says so when nothing matches, and offers a retry when loading fails', async () => {
    gql.page.mockReturnValue(pageOf([]));
    const view = renderTab();
    expect(screen.getByText('No emails found')).toBeInTheDocument();

    gql.page.mockReturnValue({ data: undefined, error: new Error('down'), refetch: gql.refetch });
    view.rerender(
      <EmailThreads object={CrmTimelineObject.Company} id="co1" defaultTo={['hello@acme.test']} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(gql.sync).toHaveBeenCalledWith({ variables: { object: 'COMPANY', id: 'co1' } });
  });

  it('starts a new email to the record', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: 'New email' }));

    expect(screen.getByText(/compose to asha@acme.test/)).toBeInTheDocument();
  });
});
