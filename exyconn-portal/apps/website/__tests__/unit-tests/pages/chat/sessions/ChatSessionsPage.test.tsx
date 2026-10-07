import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { FilterOp, WebsiteChatSessionsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ChatSessionsPage } from '../../../../../src/pages/chat/sessions/ChatSessionsPage';
import { CHAT_SESSION_COLUMNS } from '../../../../../src/pages/chat/sessions/chat-sessions-grid';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';
import { ChatConsoleHarness, fakeChatConsole } from './chat-console';
import { dashboard, dashboardProps, paged } from './crud-dashboard-stub';
import { chatMessage, sessionRow } from './fixtures';

const gql = vi.hoisted(() => ({
  stats: { data: undefined as unknown, loading: true },
  refetch: vi.fn(() => Promise.resolve({})),
  deleteSession: vi.fn(() => Promise.resolve({})),
  closeSession: vi.fn(() => Promise.resolve({})),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useWebsiteChatSessionStatsQuery: () => ({ ...gql.stats, refetch: gql.refetch }),
    useDeleteWebsiteChatSessionMutation: () => [gql.deleteSession],
    useCloseWebsiteChatSessionMutation: () => [gql.closeSession],
  };
});

vi.mock('@exyconn/crud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/crud')>();
  const stub = await import('./crud-dashboard-stub');
  return {
    ...actual,
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/components/ui')>();
  const { DatePickerStub } = await import('./date-picker-stub');
  return { ...actual, DatePicker: DatePickerStub };
});

const STATS = {
  websiteChatSessionStats: {
    total: 9,
    counts: [
      {
        field: 'status',
        buckets: [
          { value: 'OPEN', count: 4 },
          { value: 'CLOSED', count: 5 },
        ],
      },
      {
        field: 'site',
        buckets: [
          { value: 'WEBSITE', count: 7 },
          { value: 'TOOLS', count: 2 },
        ],
      },
    ],
    sums: [],
  },
};

function CurrentUrl() {
  return <p>{`At ${useCurrentUrl()}`}</p>;
}

function renderPage() {
  const chat = fakeChatConsole();
  renderWithProviders(
    <ChatConsoleHarness value={chat.value}>
      <Routes>
        <Route path="/website/chat/sessions" element={<ChatSessionsPage />} />
        <Route path="/website/chat/sessions/:id" element={<CurrentUrl />} />
      </Routes>
    </ChatConsoleHarness>,
    { route: '/website/chat/sessions' },
  );
  return chat;
}

const statTexts = () =>
  within(screen.getByRole('list', { name: 'stats' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);

beforeEach(() => {
  dashboard.props = null;
  gql.stats = { data: STATS, loading: false };
  gql.refetch.mockClear();
  gql.deleteSession.mockClear();
  gql.closeSession.mockClear();
});

describe('ChatSessionsPage', () => {
  it('sums up the chats by status and by site', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Chat sessions' })).toBeInTheDocument();
    expect(statTexts()).toEqual(['Chats: 9', 'Open: 4', 'Closed: 5', 'Website / tools: 7 / 2']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows the stats as loading until they first arrive', () => {
    gql.stats = { data: undefined, loading: true };
    renderPage();
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statTexts()).toEqual(['Chats: 0', 'Open: 0', 'Closed: 0', 'Website / tools: 0 / 0']);
  });

  it('pages through the chat sessions query with the chat columns', () => {
    renderPage();
    expect(paged.document).toBe(WebsiteChatSessionsPagedDocument);
    expect(paged.filters).toEqual([]);
    const page = { totalCount: 1, rows: [sessionRow()] };
    expect(paged.select?.({ websiteChatSessionsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(CHAT_SESSION_COLUMNS);
    expect(typeof dashboardProps().context.formatDate).toBe('function');
    expect(typeof dashboardProps().context.formatRelative).toBe('function');
  });

  it('opens a chat when its row is clicked', async () => {
    renderPage();
    act(() => {
      dashboardProps().onRowClick(sessionRow({ id: 'chat-9' }));
    });
    expect(await screen.findByText('At /website/chat/sessions/chat-9')).toBeInTheDocument();
  });

  it('opens a chat from the row action too', async () => {
    renderPage();
    act(() => {
      dashboardProps().context.actions.open(sessionRow({ id: 'chat-3' }));
    });
    expect(await screen.findByText('At /website/chat/sessions/chat-3')).toBeInTheDocument();
  });

  it('deletes a chat once confirmed, then re-reads the list', async () => {
    renderPage();
    act(() => {
      dashboardProps().context.actions.delete(sessionRow());
    });
    expect(
      await screen.findByText('Delete the chat with Asha Rao and every message in it?'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(gql.deleteSession).toHaveBeenCalledWith({ variables: { id: 's1' } }),
    );
    expect(await screen.findByText('Chat deleted')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalled();
    expect(screen.getByLabelText('refresh signal')).toHaveTextContent('1');
  });

  it('closes a chat once confirmed, then re-reads the list', async () => {
    renderPage();
    act(() => {
      dashboardProps().context.actions.close(sessionRow());
    });
    expect(
      await screen.findByText(
        'End the chat with Asha Rao? They can start a new one from the widget.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close chat' }));

    await waitFor(() => expect(gql.closeSession).toHaveBeenCalledWith({ variables: { id: 's1' } }));
    expect(await screen.findByText('Chat closed')).toBeInTheDocument();
    expect(screen.getByLabelText('refresh signal')).toHaveTextContent('1');
  });

  it('narrows the list by the toolbar filters and re-reads it', () => {
    renderPage();
    fireEvent.click(screen.getByLabelText('Unread only'));
    expect(paged.filters).toEqual([{ field: 'staffUnread', op: FilterOp.Gt, value: '0' }]);
    expect(screen.getByLabelText('refresh signal')).toHaveTextContent('1');
  });

  it('re-reads the list live and announces a new visitor message', async () => {
    const chat = renderPage();
    act(() => {
      chat.emit({ t: 'session', session: sessionRow() });
    });
    await waitFor(() => expect(screen.getByLabelText('refresh signal')).toHaveTextContent('1'));

    act(() => {
      chat.emit({ t: 'message', message: chatMessage({ senderName: 'Ravi' }) });
    });
    expect(await screen.findByText('New message from Ravi')).toBeInTheDocument();
  });
});
