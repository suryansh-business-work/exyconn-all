import {
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  buildSchema,
  type GraphQLInputType,
} from 'graphql';
import {
  CellError,
  cellValue,
  describeFields,
  enumOptions,
  namedKind,
  rowInput,
  typeKind,
} from '../../../../src/modules/table-transfer/importValues';

const schema = buildSchema(`
  scalar DateTime
  scalar Date
  scalar JSON
  enum Stage { NEW_LEAD WON LOST }
  input Address { city: String }
  type Owner { name: String }
  input DealInput {
    "What the deal is called"
    name: String!
    stage: Stage = NEW_LEAD
    amount: Float
    seats: Int!
    paid: Boolean
    closesOn: Date
    signedAt: DateTime
    meta: JSON
    address: Address
    tags: [String!]
    stages: [Stage!]!
    legacy: String @deprecated(reason: "gone")
  }
  type Query { owner: Owner }
`);

const input = schema.getType('DealInput') as GraphQLInputObjectType;
const fieldType = (name: string): GraphQLInputType => input.getFields()[name].type;

function cellError(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    if (error instanceof CellError) {
      return error.message;
    }
    throw error;
  }
  throw new Error('expected a CellError');
}

describe('namedKind and typeKind', () => {
  it('names every kind of column', () => {
    expect(typeKind(fieldType('name'))).toBe('TEXT');
    expect(typeKind(fieldType('stage'))).toBe('ENUM');
    expect(typeKind(fieldType('amount'))).toBe('NUMBER');
    expect(typeKind(fieldType('seats'))).toBe('NUMBER');
    expect(typeKind(fieldType('paid'))).toBe('BOOLEAN');
    expect(typeKind(fieldType('closesOn'))).toBe('DATE');
    expect(typeKind(fieldType('signedAt'))).toBe('DATE');
    expect(typeKind(fieldType('meta'))).toBe('OBJECT');
    expect(typeKind(fieldType('address'))).toBe('OBJECT');
    expect(typeKind(fieldType('tags'))).toBe('LIST');
    expect(typeKind(fieldType('stages'))).toBe('LIST');
  });

  it('reads an output object type as an object', () => {
    const owner = schema.getQueryType()?.getFields().owner.type;
    expect(owner && typeKind(owner)).toBe('OBJECT');
    expect(namedKind(GraphQLString)).toBe('TEXT');
  });
});

describe('enumOptions', () => {
  it('lists an enum’s values, through a list too, and nothing for any other type', () => {
    expect(enumOptions(fieldType('stage'))).toEqual(['NEW_LEAD', 'WON', 'LOST']);
    expect(enumOptions(fieldType('stages'))).toEqual(['NEW_LEAD', 'WON', 'LOST']);
    expect(enumOptions(fieldType('name'))).toEqual([]);
  });
});

describe('describeFields', () => {
  it('describes each live field, required only when non-null without a default', () => {
    const fields = describeFields(input);
    expect(fields.map((field) => field.field)).not.toContain('legacy');
    expect(fields.find((field) => field.field === 'name')).toEqual({
      field: 'name',
      required: true,
      kind: 'TEXT',
      options: [],
      description: 'What the deal is called',
    });
    expect(fields.find((field) => field.field === 'stage')).toMatchObject({
      required: false,
      kind: 'ENUM',
      description: null,
    });
    expect(fields.find((field) => field.field === 'seats')?.required).toBe(true);
    expect(fields.find((field) => field.field === 'amount')?.required).toBe(false);
  });
});

describe('cellValue', () => {
  it('reads an enum by its label, in any case and spacing', () => {
    expect(cellValue(fieldType('stage'), ' new lead ')).toBe('NEW_LEAD');
    expect(cellValue(fieldType('stage'), 'New-Lead')).toBe('NEW_LEAD');
    expect(cellError(() => cellValue(fieldType('stage'), 'pending'))).toBe(
      'must be one of NEW_LEAD, WON, LOST',
    );
  });

  it('reads numbers, refusing text, blanks and fractions of an Int', () => {
    expect(cellValue(fieldType('amount'), '12.5')).toBe(12.5);
    expect(cellValue(fieldType('seats'), '3')).toBe(3);
    expect(cellError(() => cellValue(fieldType('amount'), 'ten'))).toBe('must be a number');
    expect(cellError(() => cellValue(fieldType('amount'), ' '))).toBe('must be a number');
    expect(cellError(() => cellValue(fieldType('amount'), 'Infinity'))).toBe('must be a number');
    expect(cellError(() => cellValue(fieldType('seats'), '2.5'))).toBe('must be a whole number');
  });

  it('reads yes and no in their usual spellings', () => {
    for (const yes of ['true', 'Yes', 'y', '1']) {
      expect(cellValue(fieldType('paid'), yes)).toBe(true);
    }
    for (const no of ['FALSE', 'no', 'N', '0']) {
      expect(cellValue(fieldType('paid'), no)).toBe(false);
    }
    expect(cellError(() => cellValue(fieldType('paid'), 'maybe'))).toBe('must be yes or no');
  });

  it('reads an object as JSON', () => {
    expect(cellValue(fieldType('address'), '{"city":"Pune"}')).toEqual({ city: 'Pune' });
    expect(cellError(() => cellValue(fieldType('meta'), '{city'))).toBe('must be JSON');
  });

  it('keeps text and dates as written', () => {
    expect(cellValue(fieldType('name'), 'Renewal')).toBe('Renewal');
    expect(cellValue(fieldType('closesOn'), '2026-10-01')).toBe('2026-10-01');
  });

  it('splits a list on semicolons or commas, dropping blank items', () => {
    expect(cellValue(fieldType('tags'), 'vip; renewal,, q4 ')).toEqual(['vip', 'renewal', 'q4']);
    expect(cellValue(fieldType('stages'), 'won;lost')).toEqual(['WON', 'LOST']);
    const nested = new GraphQLNonNull(new GraphQLList(GraphQLString));
    expect(cellValue(nested, 'a')).toEqual(['a']);
  });
});

describe('rowInput', () => {
  it('reads the known, non-blank cells and ignores the rest', () => {
    expect(
      rowInput(input, { name: ' Renewal ', seats: '4', paid: '', unknown: 'x', tags: 'a;b' }),
    ).toEqual({ name: 'Renewal', seats: 4, tags: ['a', 'b'] });
  });

  it('names the field of a cell it cannot read', () => {
    expect(cellError(() => rowInput(input, { seats: 'many' }))).toBe('seats must be a number');
  });
});
