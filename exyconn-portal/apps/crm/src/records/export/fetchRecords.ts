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

/** The rows to export: what the list is showing, without its paging. */
export type ExportQuery = Pick<CrmQueryInput, 'search' | 'groups' | 'sorts'>;

/** The largest page the search resolvers serve. */
const PAGE_SIZE = 200;
/** An export stops here; a bigger set is narrowed with filters first. */
export const MAX_EXPORT_ROWS = 50_000;

interface Page {
  rows: CrmRecordRow[];
  totalCount: number;
}

async function fetchPage(
  client: ApolloClient,
  object: CrmObject,
  query: CrmQueryInput,
): Promise<Page> {
  const options = { variables: { query }, fetchPolicy: 'network-only' } as const;
  if (object === CrmObject.Lead) {
    const result = await client.query<SearchLeadsQuery>({ query: SearchLeadsDocument, ...options });
    return queryData(result, 'The lead search').searchLeads;
  }
  if (object === CrmObject.Company) {
    const result = await client.query<SearchCompaniesQuery>({
      query: SearchCompaniesDocument,
      ...options,
    });
    return queryData(result, 'The company search').searchCompanies;
  }
  const result = await client.query<SearchContactsQuery>({
    query: SearchContactsDocument,
    ...options,
  });
  return queryData(result, 'The contact search').searchContacts;
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
  const rows: CrmRecordRow[] = [];
  let totalCount = 0;
  for (let page = 0; rows.length < MAX_EXPORT_ROWS; page += 1) {
    const result = await fetchPage(client, object, { ...query, page, pageSize: PAGE_SIZE });
    totalCount = result.totalCount;
    rows.push(...result.rows);
    if (result.rows.length < PAGE_SIZE || rows.length >= totalCount) {
      break;
    }
  }
  return { rows: rows.slice(0, MAX_EXPORT_ROWS), totalCount };
}
