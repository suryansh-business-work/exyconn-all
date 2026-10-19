import { GraphQLError, buildSchema, type GraphQLObjectType } from 'graphql';
import {
  isPagedList,
  listTarget,
  runOperation,
  selectionFor,
  valueAt,
} from '../../../../src/modules/table-transfer/tableSchema';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const schema = buildSchema(`
  input TableQueryInput { page: Int }
  type Country { name: String code: String }
  type Address { city: String country: Country }
  type Customer { name: String address: Address tags: [String] secret(key: String!): String }
  type CustomerPage { rows: [Customer!]! totalCount: Int! }
  type Scalars { rows: [String!]! }
  type Query {
    listCustomersPaged(input: TableQueryInput!, archived: Boolean): CustomerPage!
    listScalarsPaged(input: TableQueryInput!): Scalars!
    listStrictPaged(input: TableQueryInput!, tenant: String!): CustomerPage!
    customers: [Customer!]!
    boom: String
  }
`);

const customer = schema.getType('Customer') as GraphQLObjectType;
const queryField = (name: string) => schema.getQueryType()?.getFields()[name];
const ctx = {} as GraphQLContext;

describe('isPagedList', () => {
  it('is a list taking TableQueryInput as its only required argument', () => {
    expect(isPagedList(queryField('listCustomersPaged'))).toBe(true);
    expect(isPagedList(queryField('listStrictPaged'))).toBe(false);
    expect(isPagedList(queryField('customers'))).toBe(false);
    expect(isPagedList(undefined)).toBe(false);
  });
});

describe('listTarget', () => {
  it('names the record type of a paged list', () => {
    const target = listTarget(schema, 'listCustomersPaged');
    expect(target.entity).toBe('Customer');
    expect(target.rowType).toBe(customer);
  });

  it('refuses a query that is not a paged list of records', () => {
    for (const list of ['customers', 'listScalarsPaged', 'listNothingPaged']) {
      expect(() => listTarget(schema, list)).toThrow(`${list} is not a paged list`);
    }
  });
});

describe('selectionFor', () => {
  it('nests dotted paths and shares their common parents', () => {
    expect(selectionFor(customer, ['name', 'address.city', 'address.country.code', 'tags'])).toBe(
      'name address { city country { code } } tags',
    );
  });

  it('refuses a path nested deeper than three fields', () => {
    expect(() => selectionFor(customer, ['address.country.name.first'])).toThrow(
      'address.country.name.first is nested too deeply to export',
    );
  });

  it('refuses a field the type does not have, or one that needs an argument', () => {
    expect(() => selectionFor(customer, ['passwordHash'])).toThrow(
      'passwordHash is not a column of Customer',
    );
    expect(() => selectionFor(customer, ['secret'])).toThrow('secret is not a column of Customer');
  });

  it('refuses a group of fields, and a path through a leaf', () => {
    expect(() => selectionFor(customer, ['address'])).toThrow(
      'address names a group of fields; pick one of its fields',
    );
    expect(() => selectionFor(customer, ['name.first'])).toThrow(
      'name.first is not a column of Customer',
    );
  });
});

describe('valueAt', () => {
  it('reads a dotted path, every item of a list along it, and null for a gap', () => {
    const row = {
      address: { city: 'Pune' },
      contacts: [{ email: 'a@x.com' }, { email: 'b@x.com' }],
    };
    expect(valueAt(row, ['address', 'city'])).toBe('Pune');
    expect(valueAt(row, ['contacts', 'email'])).toEqual(['a@x.com', 'b@x.com']);
    expect(valueAt(row, ['address', 'zip'])).toBeNull();
    expect(valueAt(null, ['x'])).toBeNull();
    expect(valueAt(row, [])).toBe(row);
  });
});

describe('runOperation', () => {
  it('answers the data of a successful operation', async () => {
    const boom = queryField('boom');
    if (boom) {
      boom.resolve = () => 'ok';
    }
    await expect(runOperation(schema, ctx, '{ boom }', {})).resolves.toEqual({ boom: 'ok' });
  });

  it('rethrows the error a resolver raised, as it raised it', async () => {
    const refusal = new GraphQLError('Not yours', { extensions: { code: 'FORBIDDEN' } });
    const boom = queryField('boom');
    if (boom) {
      boom.resolve = () => {
        throw refusal;
      };
    }
    await expect(runOperation(schema, ctx, '{ boom }', {})).rejects.toBe(refusal);
  });

  it('throws graphql’s own error for anything else', async () => {
    const boom = queryField('boom');
    if (boom) {
      boom.resolve = () => {
        throw new Error('driver went away');
      };
    }
    const failure = runOperation(schema, ctx, '{ boom }', {});
    await expect(failure).rejects.toBeInstanceOf(GraphQLError);
    await expect(failure).rejects.toThrow('driver went away');
  });
});
