import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListCannedRepliesPagedDocument } from '@exyconn/shell/graphql/generated';
import { CannedRepliesPage } from '../../../../src/pages/canned-replies';
import { CannedReplyForm } from '../../../../src/pages/canned-replies/forms/canned-reply';
import { CANNED_REPLY_COLUMNS } from '../../../../src/pages/canned-replies/canned-replies-grid';
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
import { cannedReplyRow, tableStats } from '../../fixtures';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCannedRepliesStatsQuery: gql.stats,
  useDeleteCannedReplyMutation: () => [gql.remove],
}));

const ROW = cannedReplyRow();

const answerStats = (data: object | undefined, loading = false) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

describe('CannedRepliesPage', () => {
  beforeEach(() => {
    resetCrudPage();
    gql.remove.mockReset().mockResolvedValue({ data: { deleteCannedReply: true } });
    gql.refetch.mockReset().mockResolvedValue({ data: {} });
    answerStats(undefined, true);
  });

  it('frames the snippet register under the CannedReply permission', () => {
    renderWithProviders(<CannedRepliesPage />);
    expect(dashboardProps()).toMatchObject({
      title: 'Canned replies',
      subtitle: 'The paragraphs the desk sends often — a starting point, never a send',
      entityLabel: 'canned reply',
      exportFileName: 'canned-replies',
      permissionModule: 'CannedReply',
      searchPlaceholder: 'Search by name or text…',
      crud,
      fetchRows,
    });
    expect(dashboardProps().columnDefs).toBe(CANNED_REPLY_COLUMNS);
  });

  it('shows placeholders until the stats first answer', () => {
    renderWithProviders(<CannedRepliesPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual({ Snippets: '0', Offered: '0', Retired: '0' });
  });

  it('counts the snippets offered in the composer and the retired ones', () => {
    answerStats({ listCannedRepliesStats: tableStats(9, { isActive: { true: 7, false: 2 } }) });
    renderWithProviders(<CannedRepliesPage />);
    expect(statValues()).toEqual({ Snippets: '9', Offered: '7', Retired: '2' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('keeps showing the last numbers while the stats reload', () => {
    answerStats({ listCannedRepliesStats: tableStats(3) }, true);
    renderWithProviders(<CannedRepliesPage />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statValues().Snippets).toBe('3');
  });

  it('deletes a snippet by id after naming it in the confirmation', async () => {
    renderWithProviders(<CannedRepliesPage />);
    const options = resourceOptions();
    expect(options.label).toBe('Canned reply');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(ROW)).toEqual({
      message: 'Delete "{title}"?',
      values: { title: 'Ask for a screenshot' },
    });
    await options.onDelete(ROW);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'reply-1' } });
  });

  it('reads its grid rows from the paged canned replies query', () => {
    renderWithProviders(<CannedRepliesPage />);
    const paged = { rows: [ROW], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListCannedRepliesPagedDocument);
    expect(fetcherCall().select({ listCannedRepliesPaged: paged })).toBe(paged);
  });

  it('opens the snippet form on a record, wired to close and to reload when done', () => {
    renderWithProviders(<CannedRepliesPage />);
    const form = dashboardProps().renderForm?.(ROW);
    expect(form?.type).toBe(CannedReplyForm);
    expect(form?.props).toEqual({ initial: ROW, onCancel: crud.close, onDone: crud.onDone });
  });

  it('hands the grid edit and delete to the resource', () => {
    renderWithProviders(<CannedRepliesPage />);
    const { actions } = dashboardProps().context;
    expect(actions.edit).toBe(crud.openEdit);
    expect(actions.delete).toBe(crud.remove);
  });
});
