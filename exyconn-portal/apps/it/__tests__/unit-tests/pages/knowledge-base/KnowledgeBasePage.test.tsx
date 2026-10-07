import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FilterOp,
  ListKbArticlesPagedDocument,
  SupportCategory,
} from '@exyconn/shell/graphql/generated';
import { KbArticleForm } from '@exyconn/shell/pages/content-forms';
import { KnowledgeBasePage } from '../../../../src/pages/knowledge-base';
import {
  crud,
  dashboardProps,
  fetchRows,
  fetcherCall,
  resetPage,
  resourceOptions,
  statPairs,
  statsOf,
} from '../../core/crud-page.mocks';
import { formatDate } from '../../core/settings.mock';
import { formatCell, headersOf } from '../../core/grid.helpers';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../../core/crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListKbArticlesStatsQuery: gql.stats,
  useDeleteKbArticleMutation: () => [gql.remove],
}));

const answer = (data: object | undefined, loading: boolean) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

const row = { id: 'kb-1', title: 'Reset your VPN' };

describe('KnowledgeBasePage', () => {
  beforeEach(() => {
    resetPage();
    gql.remove.mockReset();
    answer(undefined, true);
  });

  it('frames the IT articles with their grid, export name and dates', () => {
    renderWithProviders(<KnowledgeBasePage />);
    const props = dashboardProps();
    expect(props).toMatchObject({
      title: 'Knowledge Base',
      entityLabel: 'article',
      exportFileName: 'it-knowledge-base',
      permissionModule: 'KbArticle',
      fetchRows,
      crud,
      searchPlaceholder: 'Search articles…',
    });
    expect(props.context).toEqual({
      actions: { edit: crud.openEdit, delete: crud.remove },
      formatDate,
    });
    expect(headersOf(props.columnDefs)).toEqual(['Title', 'Slug', 'Published', 'Updated', '']);
    expect(formatCell(props.columnDefs, 'updatedAt', row, '2026-10-01')).toBe('on 2026-10-01');
  });

  it('lists only IT articles and writes only IT articles', () => {
    renderWithProviders(<KnowledgeBasePage />);
    expect(fetcherCall().document).toBe(ListKbArticlesPagedDocument);
    expect(fetcherCall().filters).toEqual([
      { field: 'category', op: FilterOp.Equals, value: SupportCategory.It },
    ]);
    const paged = { rows: [row], totalCount: 1 };
    expect(fetcherCall().select({ listKbArticlesPaged: paged })).toBe(paged);

    const form = dashboardProps().renderForm?.(null);
    expect(form?.type).toBe(KbArticleForm);
    expect(form?.props).toEqual({
      initial: null,
      categories: [SupportCategory.It],
      onCancel: crud.close,
      onDone: crud.onDone,
    });
  });

  it('counts the IT articles once the stats answer', () => {
    const { rerender } = renderWithProviders(<KnowledgeBasePage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statPairs()).toEqual([['IT articles', '0']]);

    answer({ listKbArticlesStats: statsOf(12, { category: { IT: 5, HR: 7 } }) }, false);
    rerender(<KnowledgeBasePage />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([['IT articles', '5']]);
  });

  it('deletes by id after confirming by title, then reloads its stats', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<KnowledgeBasePage />);
    const options = resourceOptions();
    expect(options.label).toBe('Article');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(row)).toEqual({
      message: 'Delete "{title}"?',
      values: { title: 'Reset your VPN' },
    });
    await options.onDelete(row);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'kb-1' } });
  });
});
