import type { ApolloClient } from '@apollo/client';
import type { DocumentNode } from 'graphql';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';

/** The server caps a page at 200 rows; exports walk pages until totalCount is reached. */
const PAGE_SIZE = 200;
/** 50 × 200 = 10 000 rows — a hard stop so a runaway totalCount cannot loop forever. */
const MAX_PAGES = 50;

interface Page<Row> {
  rows: Row[];
  totalCount: number;
}

/** Every row of a server-paged list, fetched page by page. */
export async function fetchAllPages<TQuery, Row>(
  client: ApolloClient<object>,
  document: DocumentNode,
  select: (data: TQuery) => Page<Row>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const input: TableQueryInput = { page, pageSize: PAGE_SIZE };
    const result = await client.query<TQuery, { input: TableQueryInput }>({
      query: document,
      variables: { input },
      fetchPolicy: 'network-only',
    });
    const current = select(result.data);
    rows.push(...current.rows);
    if (rows.length >= current.totalCount || current.rows.length === 0) break;
  }
  return rows;
}

/** A whole non-paged list query, e.g. `listUsers`. */
export async function fetchList<TQuery, Row>(
  client: ApolloClient<object>,
  document: DocumentNode,
  select: (data: TQuery) => Row[],
): Promise<Row[]> {
  const result = await client.query<TQuery>({ query: document, fetchPolicy: 'network-only' });
  return select(result.data);
}
