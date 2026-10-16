import { GraphQLError, type GraphQLSchema } from 'graphql';
import { cellText } from '@exyconn/csv';
import type { GraphQLContext } from '../../middleware/auth';
import { badRequest } from '../../utils/errors';
import { recordAudit } from '../audit';
import { importTarget, type ImportTarget, type ImportWrite } from './importTarget';
import { CellError, rowInput } from './importValues';
import { runOperation } from './tableSchema';

export type ImportMode = 'CREATE' | 'UPDATE' | 'UPSERT';

export interface ImportIssue {
  /** The row's line in the file. */
  row: number;
  message: string;
  /** True when the row was left alone on purpose (UPDATE found no record), not refused. */
  skipped: boolean;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  issues: ImportIssue[];
}

export interface ImportArgs {
  list: string;
  mode: ImportMode;
  matchField?: string | null;
  rows: unknown[];
  firstRowNumber: number;
}

/** The most rows one call takes; the client sends a file in chunks of this size. */
export const MAX_IMPORT_ROWS_PER_CALL = 500;

/** Errors that mean the whole import is refused, not one row: they are rethrown. */
const FATAL_CODES: ReadonlySet<unknown> = new Set(['FORBIDDEN', 'UNAUTHENTICATED']);
/** GraphQL's own coercion message repeats the whole row; only the reason after it is kept. */
const VARIABLE_PREFIX = /^Variable "\$\w+" got invalid value .*?; /s;

type Outcome = 'created' | 'updated' | 'skipped' | ImportIssue;

class RowError extends Error {
  constructor(
    message: string,
    readonly skipped = false,
  ) {
    super(message);
  }
}

function cellsOf(raw: unknown): Record<string, string> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new RowError('The row is not a set of columns');
  }
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, cellText(value)]));
}

async function write(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  mutation: ImportWrite,
  variables: Record<string, unknown>,
): Promise<void> {
  const source = `mutation ImportRow(${mutation.variables}) { ${mutation.name}(${mutation.args}) ${mutation.selection} }`;
  await runOperation(schema, ctx, source, variables);
}

/** The id of the one record whose match field holds `value`, null for none; two or more refuse. */
async function matchId(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  target: ImportTarget,
  field: string,
  value: string,
): Promise<string | null> {
  const source = `query ImportMatch($input: TableQueryInput!) { ${target.list}(input: $input) { rows { id ${field} } } }`;
  const input = { page: 0, pageSize: 3, filters: [{ field, op: 'EQUALS', value }] };
  const data = await runOperation<Record<string, { rows: Record<string, unknown>[] }>>(
    schema,
    ctx,
    source,
    { input },
  );
  const matches = data[target.list].rows.filter((row) => cellText(row[field]) === value);
  if (matches.length > 1) {
    throw new RowError(`More than one record has ${field} ${value}`);
  }
  return matches.length === 1 ? cellText(matches[0].id) : null;
}

async function importRow(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  target: ImportTarget,
  args: ImportArgs,
  cells: Record<string, string>,
): Promise<Outcome> {
  if (Object.values(cells).every((text) => text.trim() === '')) {
    return 'skipped';
  }
  const input = rowInput(target.create.input, cells);
  const matchValue = args.matchField ? (cells[args.matchField] ?? '').trim() : '';
  const id =
    args.mode === 'CREATE' || matchValue === ''
      ? null
      : await matchId(schema, ctx, target, args.matchField as string, matchValue);
  if (id) {
    // A match field is only offered when the module has an update (importTarget).
    await write(schema, ctx, target.update as ImportWrite, { id, input });
    return 'updated';
  }
  if (args.mode === 'UPDATE') {
    throw new RowError(`No record has ${args.matchField} ${matchValue || '(blank)'}`, true);
  }
  await write(schema, ctx, target.create, { input });
  return 'created';
}

function rowIssue(error: unknown, row: number): ImportIssue {
  if (error instanceof GraphQLError && FATAL_CODES.has(error.extensions.code)) {
    throw error;
  }
  if (error instanceof RowError || error instanceof CellError || error instanceof GraphQLError) {
    const skipped = error instanceof RowError && error.skipped;
    return { row, message: error.message.replace(VARIABLE_PREFIX, ''), skipped };
  }
  throw error;
}

function assertImportable(schema: GraphQLSchema, args: ImportArgs): ImportTarget {
  const target = importTarget(schema, args.list);
  if (!target) {
    badRequest(`${args.list} does not take imports`);
  }
  if (args.rows.length > MAX_IMPORT_ROWS_PER_CALL) {
    badRequest(`Send at most ${MAX_IMPORT_ROWS_PER_CALL} rows per call`);
  }
  if (args.mode !== 'CREATE' && !target.matchFields.includes(args.matchField ?? '')) {
    badRequest('Pick the column that identifies an existing record');
  }
  return target;
}

/**
 * Imports one chunk of mapped rows, each through the module's own create or update mutation.
 * A row that fails is reported against its line and the rest carry on; a refusal of the
 * caller (FORBIDDEN, UNAUTHENTICATED) stops the chunk, as no row of it could succeed.
 */
export async function importRows(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  args: ImportArgs,
): Promise<ImportResult> {
  const target = assertImportable(schema, args);
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, issues: [] };
  for (const [index, raw] of args.rows.entries()) {
    const row = args.firstRowNumber + index;
    let outcome: Outcome;
    try {
      outcome = await importRow(schema, ctx, target, args, cellsOf(raw));
    } catch (error) {
      outcome = rowIssue(error, row);
    }
    if (typeof outcome === 'string') {
      result[outcome] += 1;
    } else {
      result.skipped += outcome.skipped ? 1 : 0;
      result.issues.push(outcome);
    }
  }
  if (result.created + result.updated > 0) {
    await recordAudit(ctx, {
      action: 'IMPORT',
      module: target.entity,
      summary: `Imported ${target.entity}: ${result.created} created, ${result.updated} updated`,
    });
  }
  return result;
}
