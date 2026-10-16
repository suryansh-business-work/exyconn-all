import {
  execute,
  getNamedType,
  GraphQLError,
  isLeafType,
  isNonNullType,
  isObjectType,
  parse,
  type GraphQLField,
  type GraphQLObjectType,
  type GraphQLSchema,
} from 'graphql';
import type { GraphQLContext } from '../../middleware/auth';
import { badRequest } from '../../utils/errors';

/**
 * Export and import never touch a model directly: they run the module's own paged list query
 * and its own create/update mutations through the executable schema. Role guards, company
 * scoping, field resolvers, input validation and the audit log all apply exactly as they do
 * for the grid and the form, and no module needs a line of its own to take part.
 */

/** A paged list query and the record type its rows are. */
export interface ListTarget {
  /** The query field, e.g. `listClientsPaged`. */
  list: string;
  rowType: GraphQLObjectType;
  /** The record type's name: the permission module, and the `create<Name>` import writes through. */
  entity: string;
}

const MAX_PATH_DEPTH = 3;

/** Whether a query field is a paged list: `input: TableQueryInput` its only required argument. */
export function isPagedList(field: GraphQLField<unknown, unknown> | undefined): boolean {
  const takesInput = field?.args.some(
    (arg) => arg.name === 'input' && getNamedType(arg.type).name === 'TableQueryInput',
  );
  return Boolean(
    takesInput && field?.args.every((arg) => arg.name === 'input' || !isNonNullType(arg.type)),
  );
}

/** The list query named `list`, refused unless it is a paged list of records. */
export function listTarget(schema: GraphQLSchema, list: string): ListTarget {
  const field = schema.getQueryType()?.getFields()[list];
  const takesInput = isPagedList(field);
  const page = field ? getNamedType(field.type) : undefined;
  const rowType = isObjectType(page) ? getNamedType(page.getFields().rows?.type) : undefined;
  if (!takesInput || !isObjectType(rowType)) {
    badRequest(`${list} is not a paged list`);
  }
  return { list, rowType, entity: rowType.name };
}

interface SelectionTree {
  [field: string]: SelectionTree;
}

function addPath(tree: SelectionTree, type: GraphQLObjectType, segments: string[], path: string) {
  const [name, ...rest] = segments;
  const field = type.getFields()[name];
  if (!field || field.args.some((arg) => isNonNullType(arg.type))) {
    badRequest(`${path} is not a column of ${type.name}`);
  }
  const named = getNamedType(field.type);
  tree[name] ??= {};
  if (rest.length === 0) {
    if (!isLeafType(named)) {
      badRequest(`${path} names a group of fields; pick one of its fields`);
    }
    return;
  }
  if (!isObjectType(named)) {
    badRequest(`${path} is not a column of ${type.name}`);
  }
  addPath(tree[name], named, rest, path);
}

function printTree(tree: SelectionTree): string {
  return Object.entries(tree)
    .map(([name, children]) => {
      if (Object.keys(children).length === 0) {
        return name;
      }
      const inner = printTree(children);
      return `${name} { ${inner} }`;
    })
    .join(' ');
}

/**
 * The selection set that reads these dotted column paths off a record type (`customer.name`
 * becomes `customer { name }`). Every segment is checked against the schema, so a path can only
 * ever name a field the record type already exposes to the grid.
 */
export function selectionFor(type: GraphQLObjectType, paths: readonly string[]): string {
  const tree: SelectionTree = {};
  for (const path of paths) {
    const segments = path.split('.');
    if (segments.length > MAX_PATH_DEPTH) {
      badRequest(`${path} is nested too deeply to export`);
    }
    addPath(tree, type, segments, path);
  }
  return printTree(tree);
}

/** The value at a dotted path; a list along the way yields every item's value. */
export function valueAt(value: unknown, segments: readonly string[]): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => valueAt(item, segments));
  }
  if (segments.length === 0) {
    return value;
  }
  const [head, ...rest] = segments;
  return valueAt((value as Record<string, unknown>)[head], rest);
}

/**
 * Runs one operation against the schema as the caller, and returns its data. The first error
 * is rethrown as the resolver raised it, so a FORBIDDEN stays a FORBIDDEN.
 */
export async function runOperation<T>(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  source: string,
  variableValues: Record<string, unknown>,
): Promise<T> {
  const result = await execute({
    schema,
    document: parse(source),
    contextValue: ctx,
    variableValues,
  });
  const [error] = result.errors ?? [];
  if (error) {
    throw error.originalError instanceof GraphQLError ? error.originalError : error;
  }
  return result.data as T;
}
