import type { GraphQLSchema } from 'graphql';
import { fieldHeading } from '@exyconn/csv';
import type { GraphQLContext } from '../../middleware/auth';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { badRequest } from '../../utils/errors';
import { importTarget } from './importTarget';
import type { ImportField } from './importValues';
import { writeTableFile, type TableFile, type TableFileFormat } from './tableFiles';
import type { ExportColumn } from './tableExport';

export interface TemplateArgs {
  list: string;
  format: TableFileFormat;
  fileName: string;
  /** The grid's headings by field, so the template names columns as the grid does. */
  columns?: ExportColumn[] | null;
}

const FIELD_SHEET_HEADERS = ['Column', 'Required', 'Type', 'Accepted values', 'Description'];

function fieldRow(header: string, field: ImportField): string[] {
  return [
    header,
    field.required ? 'Yes' : 'No',
    field.kind,
    field.options.join(', '),
    field.description ?? '',
  ];
}

/**
 * The sample file for an import: one column per field of the module's create input, headed as
 * the grid heads it. An XLSX adds a second sheet saying which columns are required, what type
 * each takes and the values an enum accepts; a CSV is the header row alone.
 */
export async function importTemplate(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  args: TemplateArgs,
): Promise<TableFile> {
  assertAuthenticated(ctx);
  const target = importTarget(schema, args.list);
  if (!target) {
    badRequest(`${args.list} does not take imports`);
  }
  const headings = new Map((args.columns ?? []).map((column) => [column.field, column.header]));
  const headers = target.fields.map(
    (field) => headings.get(field.field) ?? fieldHeading(field.field),
  );
  return writeTableFile(args.format, args.fileName, [
    { name: target.entity, headers, rows: [] },
    {
      name: 'Columns',
      headers: FIELD_SHEET_HEADERS,
      rows: target.fields.map((field, index) => fieldRow(headers[index], field)),
    },
  ]);
}
