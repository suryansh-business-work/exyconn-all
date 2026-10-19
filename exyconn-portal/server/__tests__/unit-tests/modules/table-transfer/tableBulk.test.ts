import { GraphQLError, GraphQLSchema, buildSchema, type GraphQLFieldResolver } from 'graphql';
import {
  MAX_BULK_IDS,
  runBulkAction,
  tableBulkInfo,
} from '../../../../src/modules/table-transfer/tableBulk';
import { registerBulkTarget } from '../../../../src/modules/table-transfer/registry';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

/**
 * A schema of its own, so each shape a list can take is spelled out: an unregistered paged list
 * whose delete returns the record, a registered one whose delete returns a Boolean, a record
 * type with no delete at all and one whose delete is not keyed by id.
 */
const schema = buildSchema(`
  input TableQueryInput { page: Int }
  type Widget { id: ID! }
  type WidgetPage { rows: [Widget!]! totalCount: Int! }
  type Gadget { id: ID! }
  type GadgetPage { rows: [Gadget!]! }
  type Thing { id: ID! }
  type ThingPage { rows: [Thing!]! }
  type Nameless { id: ID! }
  type NamelessPage { rows: [Nameless!]! }
  type Query {
    listWidgetsPaged(input: TableQueryInput!): WidgetPage!
    listThingsPaged(input: TableQueryInput!): ThingPage!
    listNamelessPaged(input: TableQueryInput!): NamelessPage!
    widgets: [Widget!]!
  }
  type Mutation {
    deleteWidget(id: ID!): Widget
    deleteGadget(id: ID!): Boolean
    deleteNameless(key: String!): Boolean
  }
`);

/** A schema with neither a query nor a mutation type. */
const bare = new GraphQLSchema({});

const ctx = { user: { id: 'u1', email: 'u@x.com', roles: [] } } as unknown as GraphQLContext;

function resolveMutation(name: string, resolve: GraphQLFieldResolver<unknown, unknown>): void {
  const field = schema.getMutationType()?.getFields()[name];
  if (!field) {
    throw new Error(`no mutation ${name}`);
  }
  field.resolve = resolve;
}

const deletedWidgets: string[] = [];
const archive = jest.fn(async (_ctx: GraphQLContext, ids: string[]) => ids.length);

resolveMutation('deleteWidget', (_p, { id }: { id: string }) => {
  if (id === 'locked') {
    throw new GraphQLError('It is on an open invoice', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  if (id === 'not-mine') {
    throw new GraphQLError('Your role may not delete Widget', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  if (id === 'crash') {
    throw new Error('driver went away');
  }
  deletedWidgets.push(id);
  return { id };
});
resolveMutation('deleteGadget', () => true);

registerBulkTarget('listGadgetsPaged', { entity: 'Gadget', archive });
registerBulkTarget('listFrozenPaged', { entity: 'Widget', archive: null });

beforeEach(() => {
  deletedWidgets.length = 0;
});

describe('tableBulkInfo', () => {
  it('offers delete for a paged list whose record type has delete<Entity>(id)', () => {
    expect(tableBulkInfo(schema, 'listWidgetsPaged')).toEqual({
      deletable: true,
      archivable: false,
    });
  });

  it('offers archive only for a list registered with an archiver', () => {
    expect(tableBulkInfo(schema, 'listGadgetsPaged')).toEqual({
      deletable: true,
      archivable: true,
    });
    expect(tableBulkInfo(schema, 'listFrozenPaged')).toEqual({
      deletable: true,
      archivable: false,
    });
  });

  it('offers nothing when the record type has no delete keyed by id', () => {
    expect(tableBulkInfo(schema, 'listThingsPaged').deletable).toBe(false);
    expect(tableBulkInfo(schema, 'listNamelessPaged').deletable).toBe(false);
  });

  it('offers nothing for a query that is not a paged list, or a schema without one', () => {
    expect(tableBulkInfo(schema, 'widgets')).toEqual({ deletable: false, archivable: false });
    expect(tableBulkInfo(schema, 'listNothingPaged')).toEqual({
      deletable: false,
      archivable: false,
    });
    expect(tableBulkInfo(bare, 'listWidgetsPaged')).toEqual({
      deletable: false,
      archivable: false,
    });
    expect(tableBulkInfo(bare, 'listGadgetsPaged')).toEqual({
      deletable: false,
      archivable: true,
    });
  });
});

describe('runBulkAction', () => {
  it('needs at least one id that is not blank', async () => {
    const action = runBulkAction(schema, ctx, {
      list: 'listWidgetsPaged',
      ids: ['', '  '],
      action: 'DELETE',
    });
    await expect(action).rejects.toThrow('Select at least one row');
  });

  it('acts on at most a page of distinct ids, counting duplicates once', async () => {
    const ids = Array.from({ length: MAX_BULK_IDS }, (_v, i) => `w${i}`);
    const atLimit = await runBulkAction(schema, ctx, {
      list: 'listWidgetsPaged',
      ids: [...ids, 'w0', 'w1'],
      action: 'DELETE',
    });
    expect(atLimit).toEqual({ succeeded: MAX_BULK_IDS, failures: [] });

    const over = runBulkAction(schema, ctx, {
      list: 'listWidgetsPaged',
      ids: [...ids, 'one-more'],
      action: 'DELETE',
    });
    await expect(over).rejects.toThrow(`At most ${MAX_BULK_IDS} rows at a time`);
  });

  it('deletes each record through its own mutation and reports the ones that stay', async () => {
    const result = await runBulkAction(schema, ctx, {
      list: 'listWidgetsPaged',
      ids: ['a', 'locked', 'crash', 'b'],
      action: 'DELETE',
    });

    expect(deletedWidgets).toEqual(['a', 'b']);
    expect(result).toEqual({
      succeeded: 2,
      failures: [
        { id: 'locked', message: 'It is on an open invoice' },
        { id: 'crash', message: 'driver went away' },
      ],
    });
  });

  it('stops at a refusal that applies to the whole action', async () => {
    const action = runBulkAction(schema, ctx, {
      list: 'listWidgetsPaged',
      ids: ['a', 'not-mine', 'b'],
      action: 'DELETE',
    });

    await expect(codeOf(action)).resolves.toBe('FORBIDDEN');
    expect(deletedWidgets).toEqual(['a']);
  });

  it('deletes through a mutation that answers a Boolean', async () => {
    await expect(
      runBulkAction(schema, ctx, { list: 'listGadgetsPaged', ids: ['g1'], action: 'DELETE' }),
    ).resolves.toEqual({ succeeded: 1, failures: [] });
  });

  it('refuses to delete rows of a list without a delete, or of no list at all', async () => {
    for (const list of ['listThingsPaged', 'widgets']) {
      const action = runBulkAction(schema, ctx, { list, ids: ['x'], action: 'DELETE' });
      await expect(action).rejects.toThrow(`Rows of ${list} cannot be deleted from the table`);
    }
  });

  it('archives and restores through the registered archiver', async () => {
    await expect(
      runBulkAction(schema, ctx, {
        list: 'listGadgetsPaged',
        ids: ['g1', 'g2'],
        action: 'ARCHIVE',
      }),
    ).resolves.toEqual({ succeeded: 2, failures: [] });
    expect(archive).toHaveBeenLastCalledWith(ctx, ['g1', 'g2'], true);

    await runBulkAction(schema, ctx, { list: 'listGadgetsPaged', ids: ['g1'], action: 'RESTORE' });
    expect(archive).toHaveBeenLastCalledWith(ctx, ['g1'], false);
  });

  it('refuses to archive rows of a list without an archiver', async () => {
    for (const list of ['listFrozenPaged', 'listWidgetsPaged']) {
      const action = runBulkAction(schema, ctx, { list, ids: ['x'], action: 'ARCHIVE' });
      await expect(action).rejects.toThrow(`Rows of ${list} cannot be archived`);
    }
    expect(archive).not.toHaveBeenCalled();
  });
});
