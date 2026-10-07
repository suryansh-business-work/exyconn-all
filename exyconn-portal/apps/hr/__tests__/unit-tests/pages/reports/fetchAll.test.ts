import { describe, expect, it } from 'vitest';
import {
  ListGoalsPagedDocument,
  ListUsersDocument,
  type ListGoalsPagedQuery,
  type ListUsersQuery,
} from '@exyconn/shell/graphql/generated';
import { fetchAllPages, fetchList } from '../../../../src/pages/reports/fetchAll';
import { fakeClient, pageOf } from './fake-client';

const selectGoals = (data: ListGoalsPagedQuery) => data.listGoalsPaged;
const ids = (count: number) =>
  Array.from({ length: count }, (_unused, index) => ({ id: `g${index}` }));

describe('fetchAllPages', () => {
  it('walks 200-row pages fresh from the network until every row is in', async () => {
    const rows = ids(450);
    const { client, query } = fakeClient([
      [ListGoalsPagedDocument, (options) => ({ listGoalsPaged: pageOf(rows, options) })],
    ]);

    const all = await fetchAllPages(client, ListGoalsPagedDocument, selectGoals);

    expect(all).toHaveLength(450);
    expect(all.at(-1)).toEqual({ id: 'g449' });
    expect(query.mock.calls.map(([options]) => options.variables?.input)).toEqual([
      { page: 1, pageSize: 200 },
      { page: 2, pageSize: 200 },
      { page: 3, pageSize: 200 },
    ]);
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ fetchPolicy: 'network-only' }));
  });

  it('stops at an empty page even when the total says there is more', async () => {
    const rows = ids(10);
    const { client, query } = fakeClient([
      [ListGoalsPagedDocument, (options) => ({ listGoalsPaged: pageOf(rows, options, 999) })],
    ]);

    const all = await fetchAllPages(client, ListGoalsPagedDocument, selectGoals);

    expect(all).toHaveLength(10);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('gives up after fifty pages, so a runaway total cannot loop forever', async () => {
    const { client, query } = fakeClient([
      [
        ListGoalsPagedDocument,
        () => ({ listGoalsPaged: { rows: [{ id: 'g' }], totalCount: 1e9 } }),
      ],
    ]);

    const all = await fetchAllPages(client, ListGoalsPagedDocument, selectGoals);

    expect(query).toHaveBeenCalledTimes(50);
    expect(all).toHaveLength(50);
  });

  it('fails loudly when a page comes back with no data', async () => {
    const { client } = fakeClient();

    await expect(fetchAllPages(client, ListGoalsPagedDocument, selectGoals)).rejects.toThrow(
      'A report page returned no data',
    );
  });
});

describe('fetchList', () => {
  it('reads a whole list fresh from the network', async () => {
    const users = [{ id: 'u1' }, { id: 'u2' }];
    const { client, query } = fakeClient([[ListUsersDocument, () => ({ listUsers: users })]]);

    const all = await fetchList(
      client,
      ListUsersDocument,
      (data: ListUsersQuery) => data.listUsers,
    );

    expect(all).toBe(users);
    expect(query).toHaveBeenCalledWith({ query: ListUsersDocument, fetchPolicy: 'network-only' });
  });

  it('fails loudly when the list comes back with no data', async () => {
    const { client } = fakeClient();

    await expect(
      fetchList(client, ListUsersDocument, (data: ListUsersQuery) => data.listUsers),
    ).rejects.toThrow('A report list returned no data');
  });
});
