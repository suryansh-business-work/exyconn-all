import { GraphQLError, getNamedType, isObjectType, type GraphQLSchema } from 'graphql';
import type { GraphQLContext } from '../../middleware/auth';
import { badRequest } from '../../utils/errors';
import { registeredBulkTarget, type TableArchiver } from './registry';
import { isPagedList, listTarget, runOperation } from './tableSchema';

export type BulkAction = 'DELETE' | 'ARCHIVE' | 'RESTORE';

/** What a bulk job acts on: a paged list's rows, or — for a client-side table — an entity's. */
export interface BulkTargetArgs {
  list?: string | null;
  entity?: string | null;
  action: BulkAction;
}

export interface BulkFailure {
  id: string;
  message: string;
}

export interface BulkResult {
  succeeded: number;
  failures: BulkFailure[];
}

/** How a job acts on its ids, resolved and checked once when the job is started. */
export interface ResolvedBulk {
  action: BulkAction;
  /** The record type the rows are: whose delete runs, and what the audit names. */
  entity: string;
  /** The `delete<Entity>(id)` operation, for DELETE. */
  operation: string | null;
  archive: TableArchiver | null;
}

export interface BulkInfo {
  deletable: boolean;
  archivable: boolean;
}

/** Errors that refuse the whole action, not one record: they are rethrown. */
const FATAL_CODES: ReadonlySet<unknown> = new Set(['FORBIDDEN', 'UNAUTHENTICATED']);

/**
 * A record that is already gone. Deleting it again is the state the person asked for, which is
 * what makes a job resumed after a restart safe to re-run over the chunk it was cut off in.
 */
const GONE_CODE = 'NOT_FOUND';

/** The record type a list's rows are: as registered, or read off a paged list's page type. */
function entityOf(schema: GraphQLSchema, list: string): string | null {
  const registered = registeredBulkTarget(list);
  if (registered) {
    return registered.entity;
  }
  const field = schema.getQueryType()?.getFields()[list];
  return isPagedList(field) ? listTarget(schema, list).entity : null;
}

/** The operation deleting one record of `entity`, or null when it has no `delete<Entity>(id)`. */
function deleteOperation(schema: GraphQLSchema, entity: string): string | null {
  const field = schema.getMutationType()?.getFields()[`delete${entity}`];
  const idArg = field?.args.find((arg) => arg.name === 'id');
  if (!field || !idArg) {
    return null;
  }
  const selection = isObjectType(getNamedType(field.type)) ? '{ __typename }' : '';
  return `mutation BulkDelete($id: ${String(idArg.type)}) { ${field.name}(id: $id) ${selection} }`;
}

/** What a grid may offer for a list's selected rows. */
export function tableBulkInfo(schema: GraphQLSchema, list: string): BulkInfo {
  const entity = entityOf(schema, list);
  return {
    deletable: entity !== null && deleteOperation(schema, entity) !== null,
    archivable: registeredBulkTarget(list)?.archive != null,
  };
}

/** A delete that failed: reported against its record, unless it refuses the whole action. */
function failureOf(id: string, error: GraphQLError): BulkFailure {
  if (FATAL_CODES.has(error.extensions.code)) {
    throw error;
  }
  return { id, message: error.message };
}

/**
 * Deletes one at a time through the module's own mutation, so every guard, cascade and audit
 * entry is exactly what a single delete does; a record that cannot go is reported, not fatal.
 */
async function deleteEach(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  operation: string,
  ids: readonly string[],
): Promise<BulkResult> {
  const result: BulkResult = { succeeded: 0, failures: [] };
  for (const id of ids) {
    try {
      await runOperation(schema, ctx, operation, { id });
      result.succeeded += 1;
    } catch (error) {
      // runOperation only ever throws a GraphQLError: the resolver's own, or graphql's wrapper.
      const graphqlError = error as GraphQLError;
      if (graphqlError.extensions.code === GONE_CODE) {
        result.succeeded += 1;
      } else {
        result.failures.push(failureOf(id, graphqlError));
      }
    }
  }
  return result;
}

/** A name as given, or null when it is missing or blank. */
function named(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

/** The delete for a list's or an entity's rows, refused when there is none. */
function resolveDelete(schema: GraphQLSchema, list: string | null, entity: string | null) {
  const record = list ? entityOf(schema, list) : entity;
  const operation = record ? deleteOperation(schema, record) : null;
  if (!record || !operation) {
    badRequest(`Rows of ${list ?? entity} cannot be deleted from the table`);
  }
  return { record, operation };
}

/**
 * Checks what a bulk job is asked to do before it is queued: a list (any action) or an entity
 * (delete only, for a table that pages on the client), and that the action exists for it.
 */
export function resolveBulk(schema: GraphQLSchema, args: BulkTargetArgs): ResolvedBulk {
  const list = named(args.list);
  const entity = named(args.entity);
  if ((list === null) === (entity === null)) {
    badRequest('Name either the list or the entity the rows belong to');
  }
  if (args.action === 'DELETE') {
    const { record, operation } = resolveDelete(schema, list, entity);
    return { action: args.action, entity: record, operation, archive: null };
  }
  const target = list ? registeredBulkTarget(list) : null;
  if (!target?.archive) {
    badRequest(`Rows of ${list ?? entity} cannot be archived`);
  }
  return { action: args.action, entity: target.entity, operation: null, archive: target.archive };
}

/** Deletes, archives or restores one chunk of a job's ids, as the person who started it. */
export async function runBulkChunk(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  bulk: ResolvedBulk,
  ids: readonly string[],
): Promise<BulkResult> {
  if (bulk.operation) {
    return deleteEach(schema, ctx, bulk.operation, ids);
  }
  // resolveBulk only leaves the operation empty for an archivable list.
  const archive = bulk.archive as TableArchiver;
  const succeeded = await archive(ctx, [...ids], bulk.action === 'ARCHIVE');
  return { succeeded, failures: [] };
}
