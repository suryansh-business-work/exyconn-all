import { DateTimeResolver } from 'graphql-scalars';
import { Kind, type DefinitionNode } from 'graphql';
import { mergeResolvers, resolvers, typeDefs } from '../../../src/graphql';
import { baseTypeDefs } from '../../../src/graphql/base.typeDefs';
import { JSONScalar } from '../../../src/graphql/jsonScalar';
import { OrganizationModel } from '../../../src/modules/organizations/organization.model';

type Fn = (...args: unknown[]) => unknown;
type Merged = Record<string, Record<string, Fn | string>>;

const merge = (groups: Parameters<typeof mergeResolvers>[0]) =>
  mergeResolvers(groups) as unknown as Merged;

const definitionName = (definition: DefinitionNode): string =>
  'name' in definition && definition.name ? definition.name.value : '';

describe('mergeResolvers', () => {
  it('always carries the DateTime and JSON scalars', () => {
    const merged = mergeResolvers([]);
    expect(merged.DateTime).toBe(DateTimeResolver);
    expect(merged.JSON).toBe(JSONScalar);
    expect(merged.Query).toEqual({});
    expect(merged.Mutation).toEqual({});
  });

  it('flattens every group’s queries and mutations together', () => {
    const { Query, Mutation } = merge([
      { Query: { a: () => 'a' }, Mutation: { save: () => true } },
      { Query: { b: () => 'b' } },
      { Mutation: { remove: () => false } },
    ]);
    expect(Object.keys(Query)).toEqual(['a', 'b']);
    expect(Object.keys(Mutation)).toEqual(['save', 'remove']);
    expect((Query.b as Fn)()).toBe('b');
    expect((Mutation.remove as Fn)()).toBe(false);
  });

  it('merges two modules’ computed fields on one type, the later winning a clash', () => {
    const { Department } = merge([
      { Department: { head: () => 'first', size: () => 1 } },
      { Department: { size: () => 2, budget: () => 10 } },
    ]);
    expect((Department.head as Fn)()).toBe('first');
    expect((Department.size as Fn)()).toBe(2);
    expect((Department.budget as Fn)()).toBe(10);
  });

  it('skips a group entry that is undefined and keeps non-function values as they are', () => {
    const merged = merge([{ Invoice: undefined, Status: { ACTIVE: 'active' } }]);
    expect(merged.Invoice).toBeUndefined();
    expect(merged.Status.ACTIVE).toBe('active');
  });

  it('passes the resolver arguments through', () => {
    const resolve = jest.fn((_p: unknown, args: unknown) => args);
    const { Query } = merge([{ Query: { echo: resolve } }]);
    expect((Query.echo as Fn)(null, { id: '1' }, { user: null })).toEqual({ id: '1' });
    expect(resolve).toHaveBeenCalledWith(null, { id: '1' }, { user: null });
  });

  it('executes a Mongoose query a resolver forgot to await', async () => {
    await OrganizationModel.create({ name: 'Acme', slug: 'acme', currency: 'USD' });
    const { Query } = merge([{ Query: { orgs: () => OrganizationModel.find().lean() } }]);
    const pending = (Query.orgs as Fn)() as Promise<unknown[]>;
    expect(pending).toBeInstanceOf(Promise);
    const rows = await pending;
    expect(rows).toHaveLength(1);
  });
});

describe('the schema', () => {
  it('starts from the base definitions every module extends', () => {
    expect(typeDefs[0]).toBe(baseTypeDefs);
    const names = baseTypeDefs.definitions.map(definitionName);
    expect(names).toEqual(
      expect.arrayContaining(['DateTime', 'JSON', 'TableQueryInput', 'TableStats', 'Query']),
    );
    const roots = baseTypeDefs.definitions.filter(
      (definition) => definition.kind === Kind.OBJECT_TYPE_DEFINITION,
    );
    expect(roots.length).toBeGreaterThan(0);
  });

  it('wires every module’s resolvers into one map', () => {
    expect(typeDefs.length).toBeGreaterThan(50);
    expect(typeof resolvers.Query).toBe('object');
    expect(Object.keys(resolvers.Query).length).toBeGreaterThan(100);
    expect(Object.keys(resolvers.Mutation).length).toBeGreaterThan(100);
  });
});
