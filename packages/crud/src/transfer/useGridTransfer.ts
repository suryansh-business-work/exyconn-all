import type { TypedDocumentNode } from '@apollo/client';
import { useCallback, useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useApolloClient } from '@apollo/client/react';
import { useT } from '@exyconn/i18n';
import type { GridQuery } from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableInfo } from '@exyconn/shell/components/data/tableColumns';
import {
  TableExportDocument,
  TableFileFormat,
  TableImportMode,
  TableImportTemplateDocument,
  useImportTableRowsMutation,
  type TableExportQuery,
  type TableExportQueryVariables,
  type TableImportTemplateQuery,
  type TableImportTemplateQueryVariables,
} from '@exyconn/shell/graphql/generated';
import { downloadBase64File } from '@exyconn/shell/utils/file';
import { queryData } from '@exyconn/shell/utils/queryData';
import type { ImportRow, ImportSource } from '../import';
import { exportColumnsOf } from './exportColumns';
import { importFieldOptions, importModes } from './gridImportSource';

const tableExportQuery: TypedDocumentNode<TableExportQuery, TableExportQueryVariables> =
  TableExportDocument;
const tableImportTemplateQuery: TypedDocumentNode<
  TableImportTemplateQuery,
  TableImportTemplateQueryVariables
> = TableImportTemplateDocument;

export interface GridTransferOptions<Row> {
  /** The paged list query (`listClientsPaged`). */
  list: string;
  info: TableInfo | null;
  columnDefs: readonly ColDef<Row>[];
  /** The base of downloaded file names; the server adds the date and extension. */
  fileName: string;
  /** The import dialog's title, already translated. */
  title: string;
  /** The grid's current search, sorts and filters. */
  getQuery: () => GridQuery;
  /** Whether the viewer may update records: without it an import only creates. */
  canEdit: boolean;
}

const TEMPLATE_FORMATS = [TableFileFormat.Csv, TableFileFormat.Xlsx];

/**
 * Export, the sample file and the import source for a server-paged grid. The export is written
 * on the server from every row under the grid's search, sorts and filters; the import runs each
 * row through the module's own create and update.
 */
export function useGridTransfer<Row>({
  list,
  info,
  columnDefs,
  fileName,
  title,
  getQuery,
  canEdit,
}: GridTransferOptions<Row>) {
  const t = useT();
  const client = useApolloClient();
  const [importRows] = useImportTableRowsMutation();
  const columns = useMemo(() => exportColumnsOf(columnDefs, t), [columnDefs, t]);

  const exportFile = useCallback(
    async (format: TableFileFormat): Promise<number> => {
      const result = await client.query({
        query: tableExportQuery,
        variables: {
          list,
          input: { ...getQuery(), page: 0, pageSize: 1 },
          columns,
          format,
          fileName,
        },
        fetchPolicy: 'no-cache',
      });
      const file = queryData(result, 'The export').tableExport;
      downloadBase64File(file.fileName, file.mimeType, file.contentBase64);
      return file.rowCount;
    },
    [client, list, getQuery, columns, fileName],
  );

  const downloadTemplate = useCallback(
    async (format: TableFileFormat): Promise<void> => {
      const result = await client.query({
        query: tableImportTemplateQuery,
        variables: { list, format, fileName: `${fileName}-sample`, columns },
        fetchPolicy: 'no-cache',
      });
      const file = queryData(result, 'The sample file').tableImportTemplate;
      downloadBase64File(file.fileName, file.mimeType, file.contentBase64);
    },
    [client, list, fileName, columns],
  );

  const source = useMemo<ImportSource<TableImportMode> | null>(() => {
    if (!info?.importable) {
      return null;
    }
    const fields = importFieldOptions(info.importFields, columns, t);
    const matchField = info.matchFields[0] ?? null;
    const modes = importModes(matchField, canEdit);
    const matching = modes.length > 1;
    return {
      title,
      fields,
      modes,
      matchLabel: matching
        ? (fields.find((field) => field.key === matchField)?.label ?? null)
        : null,
      templateFormats: TEMPLATE_FORMATS,
      downloadTemplate,
      runChunk: async (rows: ImportRow[], mode: TableImportMode, firstRowNumber: number) => {
        const { data } = await importRows({
          variables: {
            list,
            mode,
            matchField: mode === TableImportMode.Create ? null : matchField,
            rows,
            firstRowNumber,
          },
        });
        return queryData({ data }, 'The import').importTableRows;
      },
    };
  }, [info, columns, t, canEdit, title, downloadTemplate, importRows, list]);

  return { exportFile, source };
}
