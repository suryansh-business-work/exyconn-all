import { describe, expect, it, vi } from 'vitest';
import type { ApolloClient } from '@apollo/client';
import {
  CrmObject,
  SearchCompaniesDocument,
  SearchContactsDocument,
  SearchLeadsDocument,
} from '@exyconn/shell/graphql/generated';
import { fetchAllRecords, MAX_EXPORT_ROWS } from '../../../../src/records/export/fetchRecords';

const rowsOf = (count: number, from = 0) =>
  Array.from({ length: count }, (_unused, index) => ({ id: `r-${from + index}` }));

/** A client whose search answers each page in turn under the given result key. */
function clientAnswering(key: string, pages: Array<{ rows: { id: string }[]; totalCount: number }>) {
  const query = vi.fn();
  for (const page of pages) {
    query.mockResolvedValueOnce({ data: { [key]: page } });
  }
  return { client: { query } as unknown as ApolloClient, query };
}

const QUERY = { search: 'acme', groups: [], sorts: [] };

describe('fetchAllRecords', () => {
  it('reads one short page of leads and stops', async () => {
    const { client, query } = clientAnswering('searchLeads', [{ rows: rowsOf(3), totalCount: 3 }]);

    const result = await fetchAllRecords(client, CrmObject.Lead, QUERY);

    expect(result).toEqual({ rows: rowsOf(3), totalCount: 3 });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith({
      query: SearchLeadsDocument,
      variables: { query: { ...QUERY, page: 0, pageSize: 200 } },
      fetchPolicy: 'network-only',
    });
  });

  it('pages through companies until every match is in', async () => {
    const { client, query } = clientAnswering('searchCompanies', [
      { rows: rowsOf(200), totalCount: 400 },
      { rows: rowsOf(200, 200), totalCount: 400 },
    ]);

    const result = await fetchAllRecords(client, CrmObject.Company, QUERY);

    expect(result.rows).toHaveLength(400);
    expect(result.totalCount).toBe(400);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0].query).toBe(SearchCompaniesDocument);
    expect(query.mock.calls[1][0].variables.query.page).toBe(1);
  });

  it('searches contacts for the contact type', async () => {
    const { client, query } = clientAnswering('searchContacts', [{ rows: [], totalCount: 0 }]);

    expect(await fetchAllRecords(client, CrmObject.Contact, QUERY)).toEqual({
      rows: [],
      totalCount: 0,
    });
    expect(query.mock.calls[0][0].query).toBe(SearchContactsDocument);
  });

  it('stops at the export cap and reports the full total', async () => {
    const pages = MAX_EXPORT_ROWS / 200;
    const query = vi.fn((options: { variables: { query: { page: number } } }) =>
      Promise.resolve({
        data: {
          searchLeads: { rows: rowsOf(200, options.variables.query.page * 200), totalCount: 90_000 },
        },
      }),
    );
    const client = { query } as unknown as ApolloClient;

    const result = await fetchAllRecords(client, CrmObject.Lead, QUERY);

    expect(query).toHaveBeenCalledTimes(pages);
    expect(result.rows).toHaveLength(MAX_EXPORT_ROWS);
    expect(result.totalCount).toBe(90_000);
  });

  it('fails when a page comes back without data', async () => {
    const client = { query: vi.fn().mockResolvedValue({}) } as unknown as ApolloClient;

    await expect(fetchAllRecords(client, CrmObject.Lead, QUERY)).rejects.toThrow(
      'The lead search returned no data',
    );
  });
});
