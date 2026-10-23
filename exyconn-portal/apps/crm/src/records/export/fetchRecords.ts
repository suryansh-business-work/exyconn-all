import type { ApolloClient } from '@apollo/client';
import {
  CrmObject,
  SearchCompaniesDocument,
  SearchContactsDocument,
  SearchLeadsDocument,
  type CrmQueryInput,
  type SearchCompaniesQuery,
  type SearchContactsQuery,
  type SearchLeadsQuery,
} from '@exyconn/shell/graphql/generated';
import { queryData } from '@exyconn/shell/utils/queryData';
import type { CrmRecordRow } from '../schema';
import type { RecordSearchDocument } from '../list/useRecordFetcher';

/** The rows to export: what the list is showing, without its paging. */
export type ExportQuery = Pick<CrmQueryInput, 'search' | 'groups' | 'sorts' | 'near'>;

/** The largest page the search resolvers serve. */
const PAGE_SIZE = 200;
/** An export stops here; a bigger set is narrowed with filters first. */
export const MAX_EXPORT_ROWS = 50_000;

interface Page {
  rows: CrmRecordRow[];
  totalCount: number;
}

async function searchPage<TQuery>(
  client: ApolloClient,
  document: RecordSearchDocument<TQuery>,
  query: CrmQueryInput,
  label: string,
  select: (data: TQuery) => Page,
): Promise<Page> {
  const result = await client.query({
    query: document,
    variables: { query },
    fetchPolicy: 'network-only',
  });
  return select(queryData(result, label));
}

function fetchPage(client: ApolloClient, object: CrmObject, query: CrmQueryInput): Promise<Page> {
  if (object === CrmObject.Lead) {
    return searchPage(
      client,
      SearchLeadsDocument,
      query,
      'The lead search',
      (data: SearchLeadsQuery) => data.searchLeads,
    );
  }
  if (object === CrmObject.Company) {
    return searchPage(
      client,
      SearchCompaniesDocument,
      query,
      'The company search',
      (data: SearchCompaniesQuery) => data.searchCompanies,
    );
  }
  return searchPage(
    client,
    SearchContactsDocument,
    query,
    'The contact search',
    (data: SearchContactsQuery) => data.searchContacts,
  );
}

export interface FetchedRecords {
  rows: CrmRecordRow[];
  /** Every record that matched, which is more than `rows` when the cap was reached. */
  totalCount: number;
}

/** Every record matching the query, a page at a time, up to {@link MAX_EXPORT_ROWS}. */
export async function fetchAllRecords(
  client: ApolloClient,
  object: CrmObject,
  query: ExportQuery,
): Promise<FetchedRecords> {
  // Only the search input's own fields: the list hands over its whole state (columns too),
  // and GraphQL refuses an input with a field it does not define.
  const { search, groups, sorts, near } = query;
  const rows: CrmRecordRow[] = [];
  let totalCount = 0;
  let page = 0;
  while (rows.length < MAX_EXPORT_ROWS) {
    const input = { search, groups, sorts, near, page, pageSize: PAGE_SIZE };
    const result = await fetchPage(client, object, input);
    totalCount = result.totalCount;
    rows.push(...result.rows);
    if (result.rows.length < PAGE_SIZE || rows.length >= totalCount) {
      break;
    }
    page += 1;
  }
  return { rows: rows.slice(0, MAX_EXPORT_ROWS), totalCount };
}
