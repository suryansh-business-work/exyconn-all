import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListLegalDocumentsPagedDocument } from '@exyconn/shell/graphql/generated';
import { DocumentsPage } from '../../../../src/pages/legal/DocumentsPage';
import { DocumentForm } from '../../../../src/pages/legal/forms/document';
import { DOCUMENT_COLUMNS } from '../../../../src/pages/legal/document-grid';
import { renderWithProviders } from '../../test-utils';
import {
  crud,
  dashboardProps,
  fetchRows,
  page,
  resetCrudPage,
  resourceOptions,
  statValues,
} from '../../crud-page.mocks';
import { documentRow, tableStats } from './legal.fixtures';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  remove: vi.fn(),
  lazy: vi.fn(),
  loadBody: vi.fn(),
  refetch: vi.fn(),
  save: vi.fn(),
}));

vi.mock('@exyconn/crud', async () => (await import('../../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useRichTextExport', () => ({ useRichTextExport: () => gql.save }));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListLegalDocumentsStatsQuery: gql.stats,
  useDeleteLegalDocumentMutation: () => [gql.remove],
  useGetLegalDocumentBodyLazyQuery: gql.lazy,
}));
vi.mock('../../../../src/pages/legal/forms/document', () => ({ DocumentForm: () => null }));

const ROW = documentRow();

const answerStats = (data: object | undefined, loading = false) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

/** Presses a download action on ROW and runs the body fetch it handed the exporter. */
function downloadBody(action: 'pdf' | 'docx'): Promise<string> {
  dashboardProps().context.actions[action](ROW);
  const source = gql.save.mock.lastCall?.[0] as () => Promise<string>;
  return source();
}

describe('DocumentsPage', () => {
  beforeEach(() => {
    resetCrudPage();
    gql.remove.mockReset().mockResolvedValue({ data: { deleteLegalDocument: true } });
    gql.loadBody.mockReset();
    gql.lazy.mockReset().mockReturnValue([gql.loadBody]);
    gql.save.mockReset().mockResolvedValue(undefined);
    answerStats(undefined, true);
  });

  it('frames the document repository under the LegalDocument permission', () => {
    renderWithProviders(<DocumentsPage />);
    expect(dashboardProps()).toMatchObject({
      title: 'Documents',
      subtitle: 'Legal document repository',
      entityLabel: 'document',
      exportFileName: 'legal-documents',
      permissionModule: 'LegalDocument',
      searchPlaceholder: 'Search documents…',
      crud,
      fetchRows,
    });
    expect(dashboardProps().columnDefs).toBe(DOCUMENT_COLUMNS);
    expect(dashboardProps().extraDialogs).toBeUndefined();
  });

  it('shows placeholders until the stats first answer', () => {
    renderWithProviders(<DocumentsPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual({ Total: '0', Final: '0', Draft: '0', Archived: '0' });
  });

  it('counts the documents by status from one stats answer', () => {
    answerStats({
      listLegalDocumentsStats: tableStats(12, { status: { FINAL: 6, DRAFT: 4, ARCHIVED: 2 } }),
    });
    renderWithProviders(<DocumentsPage />);
    expect(statValues()).toEqual({ Total: '12', Final: '6', Draft: '4', Archived: '2' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('deletes a document by id after confirming by title, then reloads its stats', async () => {
    renderWithProviders(<DocumentsPage />);
    const options = resourceOptions();
    expect(options.label).toBe('Document');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(ROW)).toEqual({
      message: 'Delete document "{title}"?',
      values: { title: 'Data processing addendum' },
    });
    await options.onDelete(ROW);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'document-1' } });
  });

  it('reads its grid rows from the paged documents query', () => {
    renderWithProviders(<DocumentsPage />);
    const paged = { rows: [ROW], totalCount: 1 };
    expect(page.fetcher?.document).toBe(ListLegalDocumentsPagedDocument);
    expect(page.fetcher?.select({ listLegalDocumentsPaged: paged })).toBe(paged);
  });

  it('opens the document form on a record, wired to close and to reload when done', () => {
    renderWithProviders(<DocumentsPage />);
    const form = dashboardProps().renderForm(ROW);
    expect(form.type).toBe(DocumentForm);
    expect(form.props).toEqual({ initial: ROW, onCancel: crud.close, onDone: crud.onDone });
  });

  it('hands the grid edit and delete straight to the resource', () => {
    renderWithProviders(<DocumentsPage />);
    const { actions } = dashboardProps().context;
    expect(actions.edit).toBe(crud.openEdit);
    expect(actions.delete).toBe(crud.remove);
    expect(dashboardProps().context.formatDate).toBeUndefined();
  });

  it('downloads a document by fetching its text fresh from the server', async () => {
    gql.loadBody.mockResolvedValue({ data: { getLegalDocument: { content: '<p>Clauses</p>' } } });
    renderWithProviders(<DocumentsPage />);
    expect(gql.lazy).toHaveBeenCalledWith({ fetchPolicy: 'network-only' });

    await expect(downloadBody('docx')).resolves.toBe('<p>Clauses</p>');
    expect(gql.save).toHaveBeenLastCalledWith(
      expect.any(Function),
      'Data processing addendum',
      'docx',
    );
    expect(gql.loadBody).toHaveBeenCalledWith({ variables: { id: 'document-1' } });
  });

  it('downloads an empty document when it has no text', async () => {
    gql.loadBody.mockResolvedValueOnce({ data: { getLegalDocument: { content: null } } });
    gql.loadBody.mockResolvedValueOnce({ data: undefined });
    renderWithProviders(<DocumentsPage />);
    await expect(downloadBody('pdf')).resolves.toBe('');
    await expect(downloadBody('pdf')).resolves.toBe('');
  });

  it('fails the download when the text cannot be fetched', async () => {
    gql.loadBody.mockResolvedValue({ data: undefined, error: new Error('Not allowed') });
    renderWithProviders(<DocumentsPage />);
    await expect(downloadBody('pdf')).rejects.toThrow('Not allowed');
  });
});
