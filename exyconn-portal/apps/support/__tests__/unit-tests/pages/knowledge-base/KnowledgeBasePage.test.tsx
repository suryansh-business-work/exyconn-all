import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListKbArticlesPagedDocument } from '@exyconn/shell/graphql/generated';
import { KbArticleForm } from '@exyconn/shell/pages/content-forms';
import { KnowledgeBasePage } from '../../../../src/pages/knowledge-base';
import { KB_ARTICLE_COLUMNS } from '../../../../src/pages/knowledge-base/kb-articles-grid';
import { renderWithProviders } from '../../test-utils';
import {
  crud,
  dashboardProps,
  fetcherCall,
  fetchRows,
  resetCrudPage,
  resourceOptions,
  statValues,
} from '../../crud-page.mocks';
import { formatDate } from '../../settings.mock';
import { kbArticleRow, tableStats } from '../../fixtures';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListKbArticlesStatsQuery: gql.stats,
  useDeleteKbArticleMutation: () => [gql.remove],
}));
// The article form (rich text and all) is the shell's, tested there; the page only wires it.
vi.mock('@exyconn/shell/pages/content-forms', () => ({ KbArticleForm: () => null }));

const ROW = kbArticleRow();

const answerStats = (data: object | undefined, loading = false) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

describe('KnowledgeBasePage', () => {
  beforeEach(() => {
    resetCrudPage();
    gql.remove.mockReset().mockResolvedValue({ data: { deleteKbArticle: true } });
    gql.refetch.mockReset().mockResolvedValue({ data: {} });
    answerStats(undefined, true);
  });

  it('frames the article register under the KbArticle permission', () => {
    renderWithProviders(<KnowledgeBasePage />);
    expect(dashboardProps()).toMatchObject({
      title: 'Knowledge base',
      subtitle: 'Answers written once, so the desk does not type them twice',
      entityLabel: 'article',
      exportFileName: 'knowledge-base',
      permissionModule: 'KbArticle',
      searchPlaceholder: 'Search by title, slug or summary…',
      crud,
      fetchRows,
    });
    expect(dashboardProps().columnDefs).toBe(KB_ARTICLE_COLUMNS);
    expect(dashboardProps().context.formatDate).toBe(formatDate);
  });

  it('shows placeholders until the stats first answer', () => {
    renderWithProviders(<KnowledgeBasePage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual({ Articles: '0', Published: '0', Drafts: '0' });
  });

  it('counts the published articles and the drafts', () => {
    answerStats({ listKbArticlesStats: tableStats(12, { isPublished: { true: 10, false: 2 } }) });
    renderWithProviders(<KnowledgeBasePage />);
    expect(statValues()).toEqual({ Articles: '12', Published: '10', Drafts: '2' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('warns that links to the slug break before deleting an article by id', async () => {
    renderWithProviders(<KnowledgeBasePage />);
    const options = resourceOptions();
    expect(options.label).toBe('Article');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(ROW)).toEqual({
      message: 'Delete "{title}"? Any link to /{slug} will stop working.',
      values: { title: 'Resetting your password', slug: 'reset-password' },
    });
    await options.onDelete(ROW);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'article-1' } });
  });

  it('reads its grid rows from the paged articles query', () => {
    renderWithProviders(<KnowledgeBasePage />);
    const paged = { rows: [ROW], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListKbArticlesPagedDocument);
    expect(fetcherCall().select({ listKbArticlesPaged: paged })).toBe(paged);
  });

  it('opens the shared article form, wired to close and to reload when done', () => {
    renderWithProviders(<KnowledgeBasePage />);
    const form = dashboardProps().renderForm?.(ROW);
    expect(form?.type).toBe(KbArticleForm);
    expect(form?.props).toEqual({ initial: ROW, onCancel: crud.close, onDone: crud.onDone });
  });

  it('hands the grid edit and delete to the resource', () => {
    renderWithProviders(<KnowledgeBasePage />);
    const { actions } = dashboardProps().context;
    expect(actions.edit).toBe(crud.openEdit);
    expect(actions.delete).toBe(crud.remove);
  });
});
