import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsiteChatKnowledgePagedDocument } from '@exyconn/shell/graphql/generated';
import { ChatKnowledgePage } from '../../../../../src/pages/chat/knowledge/ChatKnowledgePage';
import { CHAT_KNOWLEDGE_COLUMNS } from '../../../../../src/pages/chat/knowledge/chat-knowledge-grid';
import { renderWithProviders } from '../../../test-utils';
import { knowledgeRow, tableStats } from '../chat-fixtures';
import { dashboardProps, paged } from '../crud-stubs';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteKnowledge: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useWebsiteChatKnowledgeStatsQuery: () => gql.stats(),
  useDeleteWebsiteChatKnowledgeMutation: () => [gql.deleteKnowledge],
}));
vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../crud-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});
vi.mock('../../../../../src/pages/chat/forms/chat-knowledge', async () => ({
  ChatKnowledgeForm: (await import('../crud-stubs')).FormStub,
}));
vi.mock('../../../../../src/pages/chat/knowledge/KnowledgeSyncPanel', () => ({
  KnowledgeSyncPanel: ({ onSynced }: Readonly<{ onSynced: () => void }>) => (
    <button type="button" onClick={onSynced}>
      Stub sync
    </button>
  ),
}));

const statLines = () => screen.getAllByRole('listitem').map((item) => item.textContent);

describe('ChatKnowledgePage', () => {
  beforeEach(() => {
    gql.refetch.mockReset().mockResolvedValue({});
    gql.deleteKnowledge.mockReset().mockResolvedValue({ data: {} });
    gql.stats.mockReset().mockReturnValue({
      data: {
        listWebsiteChatKnowledgeEntriesStats: tableStats(12, {
          source: { WEBSITE: 9, CUSTOM: 3 },
          isActive: { true: 10, false: 2 },
        }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the entries by where they came from and how many the bot may use', () => {
    renderWithProviders(<ChatKnowledgePage />);

    expect(statLines()).toEqual(['Entries: 12', 'From the website: 9', 'Custom: 3', 'Active: 10']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows zeros marked loading until the stats answer', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    renderWithProviders(<ChatKnowledgePage />);

    expect(statLines()).toEqual(['Entries: 0', 'From the website: 0', 'Custom: 0', 'Active: 0']);
    expect(dashboardProps().statsLoading).toBe(true);
  });

  it('lists the knowledge from the paged query with the knowledge columns', () => {
    renderWithProviders(<ChatKnowledgePage />);
    const page = { totalCount: 1, rows: [knowledgeRow()] };

    expect(paged.document).toBe(WebsiteChatKnowledgePagedDocument);
    expect(paged.select?.({ listWebsiteChatKnowledgeEntriesPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Knowledge base',
      subtitle: 'What the Knowledge Bot may answer from',
      entityLabel: 'knowledge entry',
      actionLabel: 'New custom entry',
      exportFileName: 'chatbot-knowledge',
      columnDefs: CHAT_KNOWLEDGE_COLUMNS,
      searchPlaceholder: 'Search titles, links and content…',
    });
    expect(typeof dashboardProps().context.formatDate).toBe('function');
  });

  it('reloads the list and the counts after a website sync', async () => {
    renderWithProviders(<ChatKnowledgePage />);
    await userEvent.click(screen.getByRole('button', { name: 'Stub sync' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('opens a custom entry in the form, and reloads the counts once it is saved', async () => {
    renderWithProviders(<ChatKnowledgePage />);
    await act(async () => {
      await dashboardProps().context.actions.edit(knowledgeRow({ title: 'Office hours' }));
    });

    expect(screen.getByText(/"title":"Office hours"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes an entry after confirming, naming its title', async () => {
    renderWithProviders(<ChatKnowledgePage />);
    let pending: unknown;
    act(() => {
      pending = dashboardProps().context.actions.delete(knowledgeRow({ id: 'kn-4' }));
    });

    expect(
      await screen.findByText('Delete "Pricing" from the knowledge base?'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await act(async () => {
      await pending;
    });

    expect(gql.deleteKnowledge).toHaveBeenCalledWith({ variables: { id: 'kn-4' } });
    expect(await screen.findByText('Knowledge deleted')).toBeInTheDocument();
  });
});
