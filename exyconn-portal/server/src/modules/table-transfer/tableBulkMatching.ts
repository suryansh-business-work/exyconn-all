import {
  getNamedType,
  isInputObjectType,
  isObjectType,
  type GraphQLArgument,
  type GraphQLSchema,
} from 'graphql';
import type { GraphQLContext } from '../../middleware/auth';
import { badRequest } from '../../utils/errors';
import { runOperation } from './tableSchema';

/**
 * "Select all matching" on the server: the grid sends the variables its own list query loads
 * pages with (search, filters, sorts, the archived switch — a CRM search's filter groups too),
 * and the job pages through that same query here, as the person, reading only ids. The browser
 * never collects them, and the list's guards and scoping apply exactly as they do to the grid.
 */

/** The server's largest page (tableQuery's MAX_PAGE_SIZE, the CRM's maxPageSize). */
const MATCHING_PAGE_SIZE = 200;

/** The list's query, reading the total and each row's id, and the argument that pages it. */
interface MatchingQuery {
  list: string;
  source: string;
  pagingArg: string;
}

export type ListVariables = Record<string, unknown>;

type PageData = Record<string, { totalCount: number; rows: Array<{ id: string }> }>;

/** The argument whose input type carries `page` and `pageSize` (TableQueryInput, CrmQueryInput). */
function isPagingArg(arg: GraphQLArgument): boolean {
  const type = getNamedType(arg.type);
  return isInputObjectType(type) && 'page' in type.getFields() && 'pageSize' in type.getFields();
}

/** Whether the list answers a page whose rows carry an id. */
function rowsHaveIds(schema: GraphQLSchema, list: string): boolean {
  const field = schema.getQueryType()?.getFields()[list];
  const page = field ? getNamedType(field.type) : undefined;
  if (!isObjectType(page) || !('totalCount' in page.getFields())) {
    return false;
  }
  const rows = getNamedType(page.getFields().rows?.type);
  return isObjectType(rows) && 'id' in rows.getFields();
}

function matchingQuery(schema: GraphQLSchema, list: string, variables: ListVariables) {
  const field = schema.getQueryType()?.getFields()[list];
  const paging = field?.args.find(isPagingArg);
  if (!field || !paging || !rowsHaveIds(schema, list)) {
    badRequest(`Every matching row of ${list} cannot be selected`);
  }
  const args = field.args.filter((arg) => arg === paging || arg.name in variables);
  const definitions = args.map((arg) => `$${arg.name}: ${String(arg.type)}`).join(', ');
  const call = args.map((arg) => `${arg.name}: $${arg.name}`).join(', ');
  const source = `query BulkMatching(${definitions}) { ${list}(${call}) { totalCount rows { id } } }`;
  return { list, source, pagingArg: paging.name } satisfies MatchingQuery;
}

async function readPage(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  query: MatchingQuery,
  variables: ListVariables,
  page: number,
  pageSize: number,
) {
  const paging = { ...(variables[query.pagingArg] as object), page, pageSize };
  const data = await runOperation<PageData>(schema, ctx, query.source, {
    ...variables,
    [query.pagingArg]: paging,
  });
  return data[query.list];
}

/** How many rows the list's query matches, read as the person (so it is refused as they are). */
export async function countMatching(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  list: string,
  variables: ListVariables,
): Promise<number> {
  const query = matchingQuery(schema, list, variables);
  return (await readPage(schema, ctx, query, variables, 0, 1)).totalCount;
}

/**
 * Every id the list's query matches, page by page, up to `max`. A row that shifts onto the
 * next page while paging is counted once.
 */
export async function collectMatchingIds(
  schema: GraphQLSchema,
  ctx: GraphQLContext,
  list: string,
  variables: ListVariables,
  max: number,
): Promise<string[]> {
  const query = matchingQuery(schema, list, variables);
  const ids = new Set<string>();
  // Page after page: whether to read the next one depends on what this one returned.
  const readFrom = async (page: number): Promise<void> => {
    if (ids.size >= max) {
      return;
    }
    const result = await readPage(schema, ctx, query, variables, page, MATCHING_PAGE_SIZE);
    for (const row of result.rows) {
      ids.add(row.id);
    }
    if (result.rows.length === 0 || ids.size >= result.totalCount) {
      return;
    }
    await readFrom(page + 1);
  };
  await readFrom(0);
  return [...ids].slice(0, max);
}
