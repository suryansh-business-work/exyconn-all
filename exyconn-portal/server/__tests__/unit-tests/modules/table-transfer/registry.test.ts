import { buildSchema, type GraphQLResolveInfo } from 'graphql';
import { tableTransferResolvers } from '../../../../src/modules/table-transfer';
import {
  registerBulkTarget,
  registerTable,
  registeredBulkTarget,
  registeredTable,
} from '../../../../src/modules/table-transfer/registry';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

const table = { filterFields: ['email', 'status'], sortFields: ['name'] };

describe('registerTable', () => {
  it('keeps what the list can filter and sort on, and the fields an import matches by', () => {
    registerTable('listProbesPaged', table, ['email']);
    expect(registeredTable('listProbesPaged')).toEqual({
      filterFields: ['email', 'status'],
      sortFields: ['name'],
      matchFields: ['email'],
    });
    registerTable('listPlainPaged', table);
    expect(registeredTable('listPlainPaged')?.matchFields).toBeNull();
  });

  it('fails at boot when an import would match on a field the list cannot filter', () => {
    expect(() => registerTable('listBrokenPaged', table, ['email', 'phone', 'name'])).toThrow(
      'listBrokenPaged matches imports on phone, name, which it cannot filter',
    );
    expect(registeredTable('listBrokenPaged')).toBeNull();
  });
});

describe('registerBulkTarget', () => {
  it('answers null for a list nothing registered', () => {
    expect(registeredBulkTarget('listNobodyPaged')).toBeNull();
    registerBulkTarget('listNobodyPaged', { entity: 'Nobody', archive: null });
    expect(registeredBulkTarget('listNobodyPaged')).toEqual({ entity: 'Nobody', archive: null });
  });
});

describe('the bulk resolvers', () => {
  const schema = buildSchema(`
    input TableQueryInput { page: Int }
    type Probe { id: ID! }
    type ProbePage { rows: [Probe!]! }
    type Query { listProbesPaged(input: TableQueryInput!): ProbePage! }
    type Mutation { deleteProbe(id: ID!): Boolean }
  `);
  const info = { schema } as GraphQLResolveInfo;
  const signedIn = { user: { id: 'u1', email: 'u@x.com', roles: [] } } as unknown as GraphQLContext;
  const anonymous = {} as GraphQLContext;
  const { tableBulkInfo } = tableTransferResolvers.Query;
  const { tableBulkAction } = tableTransferResolvers.Mutation;

  it('describes the bulk actions of a list to anybody signed in', () => {
    expect(tableBulkInfo(null, { list: 'listProbesPaged' }, signedIn, info)).toEqual({
      deletable: true,
      archivable: false,
    });
    expect(() => tableBulkInfo(null, { list: 'listProbesPaged' }, anonymous, info)).toThrow(
      'Authentication required',
    );
  });

  it('runs a bulk action only for somebody signed in', async () => {
    const args = { list: 'listProbesPaged', ids: ['p1'], action: 'DELETE' as const };
    await expect(tableBulkAction(null, args, signedIn, info)).resolves.toEqual({
      succeeded: 1,
      failures: [],
    });
    await expect(
      codeOf(Promise.resolve().then(() => tableBulkAction(null, args, anonymous, info))),
    ).resolves.toBe('UNAUTHENTICATED');
  });
});
