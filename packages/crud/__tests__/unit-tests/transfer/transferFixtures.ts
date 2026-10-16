import type { MockLink } from '@apollo/client/testing';
import {
  TableExportDocument,
  TableFieldKind,
  TableFileFormat,
  TableImportTemplateDocument,
  TableInfoDocument,
  type TableInfoQuery,
} from '@exyconn/shell/graphql/generated';
import type { GridQuery } from '@exyconn/shell/components/data/serverGridQuery';
import { actionsColumn, textColumn } from '../../../src/grid/columns';

export interface Client {
  name: string;
  email: string;
}

export const clientColumns = [
  textColumn<Client>('name', 'Name'),
  textColumn<Client>('email', 'Email'),
  actionsColumn<Client>(),
];

export const exportedColumns = [
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' },
];

export const gridQuery: GridQuery = { search: 'ac', sort: null, filters: [] };

export type TableInfo = TableInfoQuery['tableInfo'];

export const tableInfo = (overrides: Partial<TableInfo> = {}): TableInfo => ({
  __typename: 'TableInfo',
  filters: [],
  sortFields: [],
  importable: true,
  matchFields: ['email'],
  importFields: [
    {
      __typename: 'TableImportField',
      field: 'name',
      required: true,
      kind: TableFieldKind.Text,
      options: [],
      description: null,
    },
    {
      __typename: 'TableImportField',
      field: 'email',
      required: false,
      kind: TableFieldKind.Text,
      options: [],
      description: null,
    },
  ],
  ...overrides,
});

export const tableInfoMock = (list: string, info: TableInfo): MockLink.MockedResponse => ({
  request: { query: TableInfoDocument, variables: { list } },
  result: { data: { tableInfo: info } },
});

const tableFile = (fileName: string, rowCount: number) => ({
  __typename: 'TableFile',
  fileName,
  mimeType: 'text/csv',
  contentBase64: 'TmFtZQ==',
  rowCount,
});

export const exportMock = (
  format: TableFileFormat,
  result: MockLink.MockedResponse['result'] = {
    data: { tableExport: tableFile('clients-2026-10-16.csv', 3) },
  },
): MockLink.MockedResponse => ({
  request: {
    query: TableExportDocument,
    variables: {
      list: 'listClientsPaged',
      input: { ...gridQuery, page: 0, pageSize: 1 },
      columns: exportedColumns,
      format,
      fileName: 'clients',
    },
  },
  result,
});

export const templateMock = (format: TableFileFormat): MockLink.MockedResponse => ({
  request: {
    query: TableImportTemplateDocument,
    variables: {
      list: 'listClientsPaged',
      format,
      fileName: 'clients-sample',
      columns: exportedColumns,
    },
  },
  result: { data: { tableImportTemplate: tableFile('clients-sample.xlsx', 0) } },
});
