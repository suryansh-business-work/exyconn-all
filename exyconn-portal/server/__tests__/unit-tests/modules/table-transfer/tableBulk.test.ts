import { GraphQLError, GraphQLSchema, buildSchema, type GraphQLFieldResolver } from 'graphql';
import {
  resolveBulk,
  runBulkChunk,
  tableBulkInfo,
  type BulkTargetArgs,
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
  if (id === 'gone') {
    throw new GraphQLError('Widget not found', { extensions: { code: 'NOT_FOUND' } });
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

/** Resolves a target and runs one chunk of ids through it, as the bulk worker does. */
function run(args: BulkTargetArgs, ids: string[]) {
  return runBulkChunk(schema, ctx, resolveBulk(schema, args), ids);
}

describe('resolveBulk', () => {
  it('needs exactly one of a list or an entity, ignoring blank names', () => {
    expect(() => resolveBulk(schema, { action: 'DELETE' })).toThrow(
      'Name either the list or the entity the rows belong to',
    );
    expect(() =>
      resolveBulk(schema, { list: 'listWidgetsPaged', entity: 'Widget', action: 'DELETE' }),
    ).toThrow('Name either the list or the entity the rows belong to');
    expect(resolveBulk(schema, { list: '  ', entity: 'Widget', action: 'DELETE' })).toEqual(
      expect.objectContaining({ entity: 'Widget', action: 'DELETE', archive: null }),
    );
  });

  it('reads the entity off a list, or takes the one a client-side table names', () => {
    expect(resolveBulk(schema, { list: 'listGadgetsPaged', action: 'DELETE' }).entity).toBe(
      'Gadget',
    );
    expect(resolveBulk(schema, { entity: 'Gadget', action: 'DELETE' }).operation).toBe(
      'mutation BulkDelete($id: ID!) { deleteGadget(id: $id)  }',
    );
  });

  it('refuses to delete rows of a list or an entity without a delete', () => {
    for (const list of ['listThingsPaged', 'widgets']) {
      expect(() => resolveBulk(schema, { list, action: 'DELETE' })).toThrow(
        `Rows of ${list} cannot be deleted from the table`,
      );
    }
    expect(() => resolveBulk(schema, { entity: 'Nameless', action: 'DELETE' })).toThrow(
      'Rows of Nameless cannot be deleted from the table',
    );
  });

  it('archives only a list registered with an archiver, never an entity', () => {
    expect(resolveBulk(schema, { list: 'listGadgetsPaged', action: 'ARCHIVE' })).toEqual({
      action: 'ARCHIVE',
      entity: 'Gadget',
      operation: null,
      archive,
    });
    for (const list of ['listFrozenPaged', 'listWidgetsPaged']) {
      expect(() => resolveBulk(schema, { list, action: 'ARCHIVE' })).toThrow(
        `Rows of ${list} cannot be archived`,
      );
    }
    expect(() => resolveBulk(schema, { entity: 'Gadget', action: 'RESTORE' })).toThrow(
      'Rows of Gadget cannot be archived',
    );
  });
});

describe('runBulkChunk', () => {
  it('deletes each record through its own mutation and reports the ones that stay', async () => {
    const result = await run({ list: 'listWidgetsPaged', action: 'DELETE' }, [
      'a',
      'locked',
      'crash',
      'b',
    ]);

    expect(deletedWidgets).toEqual(['a', 'b']);
    expect(result).toEqual({
      succeeded: 2,
      failures: [
        { id: 'locked', message: 'It is on an open invoice' },
        { id: 'crash', message: 'driver went away' },
      ],
    });
  });

  it('counts a record that is already gone as deleted, so a resumed chunk can re-run', async () => {
    const result = await run({ entity: 'Widget', action: 'DELETE' }, ['gone', 'c']);

    expect(result).toEqual({ succeeded: 2, failures: [] });
    expect(deletedWidgets).toEqual(['c']);
  });

  it('stops at a refusal that applies to the whole action', async () => {
    const action = run({ list: 'listWidgetsPaged', action: 'DELETE' }, ['a', 'not-mine', 'b']);

    await expect(codeOf(action)).resolves.toBe('FORBIDDEN');
    expect(deletedWidgets).toEqual(['a']);
  });

  it('deletes through a mutation that answers a Boolean', async () => {
    await expect(run({ list: 'listGadgetsPaged', action: 'DELETE' }, ['g1'])).resolves.toEqual({
      succeeded: 1,
      failures: [],
    });
  });

  it('archives and restores through the registered archiver', async () => {
    await expect(
      run({ list: 'listGadgetsPaged', action: 'ARCHIVE' }, ['g1', 'g2']),
    ).resolves.toEqual({ succeeded: 2, failures: [] });
    expect(archive).toHaveBeenLastCalledWith(ctx, ['g1', 'g2'], true);

    await run({ list: 'listGadgetsPaged', action: 'RESTORE' }, ['g1']);
    expect(archive).toHaveBeenLastCalledWith(ctx, ['g1'], false);
  });
});
