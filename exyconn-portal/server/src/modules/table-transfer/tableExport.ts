import type { GraphQLSchema } from 'graphql';
import type { GraphQLContext } from '../../middleware/auth';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { isAllowed } from '../../lib/permissions';
import { badRequest, forbidden } from '../../utils/errors';
import type { TableQueryInput } from '../../utils/tableQuery';
import { recordAudit } from '../audit';
import { exportCell, writeTableFile, type TableFile, type TableFileFormat } from './tableFiles';
import { listTarget, runOperation, selectionFor, valueAt } from './tableSchema';

/** One exported column: the row field it reads (dotted for nested) and its heading. */
export interface ExportColumn {
  field: string;
  header: string;
}

export interface ExportArgs {
  list: string;
  input: TableQueryInput;
  columns: ExportColumn[];
  format: TableFileFormat;
  fileName: string;
}

/** The most rows one file holds; a bigger export is refused before it is read. */
export const EXPORT_MAX_ROWS = 50_000;
export const EXPORT_MAX_COLUMNS = 100;
const MAX_HEADER_LENGTH = 200;
/** The server's largest page (tableQuery's MAX_PAGE_SIZE). */
const EXPORT_PAGE_SIZE = 200;

type PageData = Record<string, { totalCount: number; rows: unknown[] }>;

/** Every row of the query, page by page, through the list's own resolver. */
async function readAll(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  source: string,
  args: ExportArgs,
): Promise<unknown[]> {
  const rows: unknown[] = [];
  let totalCount = Number.POSITIVE_INFINITY;
  let page = 0;
  while (rows.length < totalCount) {
    const input = { ...args.input, page, pageSize: EXPORT_PAGE_SIZE };
    const result = (await runOperation<PageData>(schema, ctx, source, { input }))[args.list];
    if (result.totalCount > EXPORT_MAX_ROWS) {
      badRequest(
        `There are ${result.totalCount} rows to export; up to ${EXPORT_MAX_ROWS} fit in one file. Narrow the search or filters first.`,
      );
    }
    if (result.rows.length === 0) {
      break;
    }
    rows.push(...result.rows);
    totalCount = result.totalCount;
    page += 1;
  }
  return rows;
}

function assertColumns(columns: readonly ExportColumn[]): void {
  if (columns.length === 0 || columns.length > EXPORT_MAX_COLUMNS) {
    badRequest(`Export between 1 and ${EXPORT_MAX_COLUMNS} columns`);
  }
  if (columns.some((column) => column.header.length > MAX_HEADER_LENGTH)) {
    badRequest(`A column heading is limited to ${MAX_HEADER_LENGTH} characters`);
  }
}

/**
 * Writes every row a grid shows — under its search, sort and filters — as a CSV or XLSX file.
 * The rows are read through the list's own resolver, so its guards and scoping apply; the
 * role must also hold EXPORT on the module, and the export is recorded in the audit log.
 */
export async function exportTable(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  args: ExportArgs,
): Promise<TableFile> {
  const user = assertAuthenticated(ctx);
  const target = listTarget(schema, args.list);
  assertColumns(args.columns);
  if (!(await isAllowed(user.roles ?? [], target.entity, 'EXPORT'))) {
    forbidden(`Your role may not export ${target.entity}`);
  }
  const selection = selectionFor(
    target.rowType,
    args.columns.map((column) => column.field),
  );
  const source = `query TableExport($input: TableQueryInput!) { ${args.list}(input: $input) { totalCount rows { ${selection} } } }`;
  const records = await readAll(schema, ctx, source, args);
  const paths = args.columns.map((column) => column.field.split('.'));
  const rows = records.map((record) => paths.map((path) => exportCell(valueAt(record, path))));
  const headers = args.columns.map((column) => column.header);
  const file = await writeTableFile(args.format, args.fileName, [
    { name: target.entity, headers, rows },
  ]);
  await recordAudit(ctx, {
    action: 'ACCESS',
    module: target.entity,
    summary: `Exported ${rows.length} ${target.entity} rows as ${args.format}`,
  });
  return file;
}
