import {
  MIN_QUERY_LENGTH,
  clearSearchProviders,
  containsAny,
  registerSearchProvider,
  searchResolvers,
  searchTypeDefs,
  type SearchProvider,
} from '../../../../src/modules/search';
import { MAX_QUERY_LENGTH } from '../../../../src/modules/search/search.text';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const search = searchResolvers.Query.search as unknown as Resolver;

const ctx = (roles?: string[]) =>
  ({ user: { id: 'u1', email: 'u1@exyconn.test', roles } }) as unknown as GraphQLContext;

/** A provider that remembers every query it was asked and answers with one hit. */
function recordingProvider(key: string, roles: SearchProvider['roles']) {
  const find = jest.fn(async (query: string) => [
    { id: `${key}-1`, title: query, subtitle: '', link: `/${key}` },
  ]);
  registerSearchProvider({ key, label: key.toUpperCase(), roles, find });
  return find;
}

beforeEach(() => {
  clearSearchProviders();
});

describe('the search query', () => {
  it('refuses somebody who is not signed in', async () => {
    recordingProvider('people', [ROLES.EMPLOYEE]);

    await expect(codeOf(search(null, { query: 'asha' }, {} as GraphQLContext))).resolves.toBe(
      'UNAUTHENTICATED',
    );
  });

  it('searches only the groups the caller’s roles reach', async () => {
    const people = recordingProvider('people', [ROLES.EMPLOYEE]);
    const invoices = recordingProvider('invoices', [ROLES.FINANCE]);

    const groups = await search(null, { query: 'asha' }, ctx([ROLES.EMPLOYEE]));

    expect(groups).toEqual([
      { key: 'people', label: 'PEOPLE', hits: [expect.objectContaining({ title: 'asha' })] },
    ]);
    expect(people).toHaveBeenCalledWith('asha', 5);
    expect(invoices).not.toHaveBeenCalled();
  });

  it('reaches nothing for a token that carries no roles', async () => {
    const people = recordingProvider('people', [ROLES.EMPLOYEE]);

    await expect(search(null, { query: 'asha' }, ctx())).resolves.toEqual([]);
    expect(people).not.toHaveBeenCalled();
  });

  it('trims the query and cuts a pasted wall of text down to the longest it takes', async () => {
    const people = recordingProvider('people', [ROLES.EMPLOYEE]);

    await search(null, { query: '  asha  ' }, ctx([ROLES.EMPLOYEE]));
    await search(null, { query: 'x'.repeat(MAX_QUERY_LENGTH + 20) }, ctx([ROLES.EMPLOYEE]));

    expect(people.mock.calls.map(([query]) => query)).toEqual([
      'asha',
      'x'.repeat(MAX_QUERY_LENGTH),
    ]);
  });

  it('runs a query of exactly the minimum length, and nothing shorter once trimmed', async () => {
    const people = recordingProvider('people', [ROLES.EMPLOYEE]);
    const shortest = 'a'.repeat(MIN_QUERY_LENGTH);

    await expect(search(null, { query: ' a ' }, ctx([ROLES.EMPLOYEE]))).resolves.toEqual([]);
    await search(null, { query: shortest }, ctx([ROLES.EMPLOYEE]));

    expect(people).toHaveBeenCalledTimes(1);
    expect(people).toHaveBeenCalledWith(shortest, 5);
  });
});

describe('the search text helpers', () => {
  it('builds one case-insensitive contains match per field', () => {
    expect(containsAny(['name', 'email'], 'a.b')).toEqual({
      $or: [
        { name: { $regex: String.raw`a\.b`, $options: 'i' } },
        { email: { $regex: String.raw`a\.b`, $options: 'i' } },
      ],
    });
  });

  it('declares the search query in the schema', () => {
    expect(searchTypeDefs.loc?.source.body).toContain('search(query: String!): [SearchGroup!]!');
  });
});
