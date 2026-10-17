import { GraphQLError, getNamedType, isObjectType, type GraphQLSchema } from 'graphql';
import type { GraphQLContext } from '../../middleware/auth';
import { badRequest } from '../../utils/errors';
import { registeredBulkTarget } from './registry';
import { isPagedList, listTarget, runOperation } from './tableSchema';

export type BulkAction = 'DELETE' | 'ARCHIVE' | 'RESTORE';

export interface BulkArgs {
  list: string;
  ids: string[];
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

export interface BulkInfo {
  deletable: boolean;
  archivable: boolean;
}

/** The most records one call acts on: a grid page at its largest. */
export const MAX_BULK_IDS = 200;

/** Errors that refuse the whole action, not one record: they are rethrown. */
const FATAL_CODES: ReadonlySet<unknown> = new Set(['FORBIDDEN', 'UNAUTHENTICATED']);

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

function failureOf(id: string, error: unknown): BulkFailure {
  const code = error instanceof GraphQLError ? error.extensions.code : undefined;
  if (FATAL_CODES.has(code)) {
    throw error;
  }
  return { id, message: error instanceof Error ? error.message : 'Could not delete it' };
}

/**
 * Deletes one at a time through the module's own mutation, so every guard, cascade and audit
 * entry is exactly what a single delete does; a record that cannot go is reported, not fatal.
 */
async function deleteEach(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  operation: string,
  ids: string[],
): Promise<BulkResult> {
  const result: BulkResult = { succeeded: 0, failures: [] };
  for (const id of ids) {
    try {
      await runOperation(schema, ctx, operation, { id });
      result.succeeded += 1;
    } catch (error) {
      result.failures.push(failureOf(id, error));
    }
  }
  return result;
}

/** Deletes, archives or restores the selected rows of a list. */
export async function runBulkAction(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  { list, ids, action }: BulkArgs,
): Promise<BulkResult> {
  const unique = [...new Set(ids.filter((id) => id.trim() !== ''))];
  if (unique.length === 0) {
    badRequest('Select at least one row');
  }
  if (unique.length > MAX_BULK_IDS) {
    badRequest(`At most ${MAX_BULK_IDS} rows at a time`);
  }
  if (action === 'DELETE') {
    const entity = entityOf(schema, list);
    const operation = entity ? deleteOperation(schema, entity) : null;
    if (!operation) {
      badRequest(`Rows of ${list} cannot be deleted from the table`);
    }
    return deleteEach(schema, ctx, operation, unique);
  }
  const archive = registeredBulkTarget(list)?.archive;
  if (!archive) {
    badRequest(`Rows of ${list} cannot be archived`);
  }
  const succeeded = await archive(ctx, unique, action === 'ARCHIVE');
  return { succeeded, failures: [] };
}
