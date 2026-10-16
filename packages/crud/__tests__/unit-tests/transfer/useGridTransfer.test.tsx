import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockLink } from '@apollo/client/testing';
import {
  ImportTableRowsDocument,
  TableFileFormat,
  TableImportMode,
} from '@exyconn/shell/graphql/generated';
import { downloadBase64File } from '@exyconn/shell/utils/file';
import { useGridTransfer } from '../../../src/transfer/useGridTransfer';
import { renderHookWithProviders } from '../test-utils';
import {
  clientColumns,
  exportMock,
  gridQuery,
  tableInfo,
  templateMock,
  type TableInfo,
} from './transferFixtures';

vi.mock('@exyconn/shell/utils/file', async (importActual) => ({
  ...(await importActual<typeof import('@exyconn/shell/utils/file')>()),
  downloadBase64File: vi.fn(),
}));

const renderTransfer = (
  info: TableInfo | null,
  canEdit: boolean,
  mocks: MockLink.MockedResponse[] = [],
) =>
  renderHookWithProviders(
    () =>
      useGridTransfer({
        list: 'listClientsPaged',
        info,
        columnDefs: clientColumns,
        fileName: 'clients',
        title: 'Import client records',
        getQuery: () => gridQuery,
        canEdit,
      }),
    { mocks },
  );

const importMock = (mode: TableImportMode, matchField: string | null): MockLink.MockedResponse => ({
  request: {
    query: ImportTableRowsDocument,
    variables: {
      list: 'listClientsPaged',
      mode,
      matchField,
      rows: [{ name: 'Acme' }],
      firstRowNumber: 2,
    },
  },
  result: {
    data: {
      importTableRows: {
        __typename: 'TableImportResult',
        created: 0,
        updated: 1,
        skipped: 0,
        issues: [],
      },
    },
  },
});

beforeEach(() => {
  vi.mocked(downloadBase64File).mockClear();
});

describe('useGridTransfer export', () => {
  it("exports every row under the grid's query on the server and downloads the file", async () => {
    const { result } = renderTransfer(null, true, [exportMock(TableFileFormat.Csv)]);
    await expect(result.current.exportFile(TableFileFormat.Csv)).resolves.toBe(3);
    expect(downloadBase64File).toHaveBeenCalledWith(
      'clients-2026-10-16.csv',
      'text/csv',
      'TmFtZQ==',
    );
  });

  it('rejects when the server refuses the export', async () => {
    const { result } = renderTransfer(null, true, [
      exportMock(TableFileFormat.Xlsx, { errors: [{ message: 'Too many rows' }] }),
    ]);
    await expect(result.current.exportFile(TableFileFormat.Xlsx)).rejects.toThrow('Too many rows');
    expect(downloadBase64File).not.toHaveBeenCalled();
  });
});

describe('useGridTransfer import source', () => {
  it('has no import source until the server opens the list to import', () => {
    expect(renderTransfer(null, true).result.current.source).toBeNull();
    expect(renderTransfer(tableInfo({ importable: false }), true).result.current.source).toBeNull();
  });

  it('matches by the first match field when the viewer may edit', () => {
    const source = renderTransfer(tableInfo(), true).result.current.source;
    expect(source?.title).toBe('Import client records');
    expect(source?.matchLabel).toBe('Email');
    expect(source?.modes.map((entry) => entry.mode)).toEqual([
      TableImportMode.Upsert,
      TableImportMode.Create,
      TableImportMode.Update,
    ]);
    expect(source?.fields.map((field) => [field.key, field.label, field.required])).toEqual([
      ['name', 'Name', true],
      ['email', 'Email', false],
    ]);
  });

  it('only creates, with no match note, when the viewer may not edit', () => {
    const source = renderTransfer(tableInfo(), false).result.current.source;
    expect(source?.modes.map((entry) => entry.mode)).toEqual([TableImportMode.Create]);
    expect(source?.matchLabel).toBeNull();
  });

  it('only creates when the list has no match field', () => {
    const source = renderTransfer(tableInfo({ matchFields: [] }), true).result.current.source;
    expect(source?.modes).toHaveLength(1);
    expect(source?.matchLabel).toBeNull();
  });

  it('names no match field it cannot label', () => {
    const source = renderTransfer(tableInfo({ matchFields: ['externalId'] }), true).result.current
      .source;
    expect(source?.modes).toHaveLength(3);
    expect(source?.matchLabel).toBeNull();
  });

  it('sends a chunk matched by the match field, and a create chunk with none', async () => {
    const { result } = renderTransfer(tableInfo(), true, [
      importMock(TableImportMode.Update, 'email'),
      importMock(TableImportMode.Create, null),
    ]);
    const source = result.current.source;
    await expect(source?.runChunk([{ name: 'Acme' }], TableImportMode.Update, 2)).resolves.toEqual(
      expect.objectContaining({ created: 0, updated: 1, skipped: 0, issues: [] }),
    );
    await expect(source?.runChunk([{ name: 'Acme' }], TableImportMode.Create, 2)).resolves.toEqual(
      expect.objectContaining({ updated: 1 }),
    );
  });

  it('downloads the sample file the server writes', async () => {
    const { result } = renderTransfer(tableInfo(), true, [templateMock(TableFileFormat.Xlsx)]);
    await result.current.source?.downloadTemplate(TableFileFormat.Xlsx);
    expect(downloadBase64File).toHaveBeenCalledWith('clients-sample.xlsx', 'text/csv', 'TmFtZQ==');
    expect(result.current.source?.templateFormats).toEqual([
      TableFileFormat.Csv,
      TableFileFormat.Xlsx,
    ]);
  });
});
