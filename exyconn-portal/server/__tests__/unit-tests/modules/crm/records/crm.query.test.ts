import { LeadModel } from '../../../../../src/modules/crm/crm.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import { CrmPropertyModel } from '../../../../../src/modules/crm/records/crm-property.model';
import {
  compileFilter,
  compileSort,
  CRM_QUERY_LIMITS,
  searchRecords,
  type CrmCondition,
  type CrmQueryInput,
} from '../../../../../src/modules/crm/records/crm.query';
import { propertyIndex } from '../../../../../src/modules/crm/records/crm.schema';
import type { CrmOp } from '../../../../../src/modules/crm/records/crm.schema';

/** A lean record's name; search rows are typed only by their ids. */
const nameOf = (row: object): unknown => Reflect.get(row, 'name');

const cond = (property: string, op: CrmOp, ...values: string[]): CrmCondition => ({
  property,
  op,
  values,
});

const query = (overrides: Partial<CrmQueryInput> = {}): CrmQueryInput => ({
  page: 0,
  pageSize: 50,
  ...overrides,
});

/** The names of the leads one group of conditions finds, in name order. */
async function leadsWhere(...conditions: CrmCondition[]): Promise<unknown[]> {
  const { rows } = await searchRecords(
    'LEAD',
    query({ groups: [{ conditions }], sorts: [{ property: 'name', dir: 'ASC' }] }),
  );
  return rows.map(nameOf);
}

const lead = (name: string, fields: Record<string, unknown> = {}) => ({
  name,
  email: `${name.toLowerCase()}@acme.com`,
  value: 0,
  owner: 'Asha',
  ...fields,
});

beforeEach(async () => {
  await CrmPropertyModel.create([
    { object: 'LEAD', key: 'brief', label: 'Brief', type: 'TEXTAREA', order: 0 },
    {
      object: 'LEAD',
      key: 'tags',
      label: 'Tags',
      type: 'MULTI_SELECT',
      order: 1,
      options: [
        { value: 'HOT', label: 'Hot' },
        { value: 'COLD', label: 'Cold' },
      ],
    },
    { object: 'LEAD', key: 'vip', label: 'VIP', type: 'BOOLEAN', order: 2 },
    { object: 'LEAD', key: 'signed', label: 'Signed', type: 'DATE', order: 3 },
  ]);
  await LeadModel.create([
    lead('Alpha', {
      value: 9,
      stage: 'NEW',
      notes: 'Met at the expo',
      custom: {
        brief: 'Needs a CRM rollout',
        tags: ['HOT'],
        vip: true,
        signed: new Date('2026-01-10T00:00:00Z'),
      },
    }),
    lead('Bravo', {
      value: 10,
      stage: 'WON',
      notes: '',
      custom: { tags: ['COLD', 'HOT'], vip: false, signed: new Date('2026-03-01T00:00:00Z') },
    }),
    lead('Charlie', { value: 100, stage: 'LOST', email: 'charlie@beta.io', owner: 'Ravi' }),
  ]);
});

describe('text conditions', () => {
  it.each([
    [cond('name', 'CONTAINS', 'ar'), ['Charlie']],
    [cond('name', 'NOT_CONTAINS', 'ar'), ['Alpha', 'Bravo']],
    [cond('name', 'EQ', ' bravo '), ['Bravo']],
    [cond('name', 'NEQ', 'bravo'), ['Alpha', 'Charlie']],
    [cond('email', 'STARTS_WITH', 'ALPHA@'), ['Alpha']],
    [cond('email', 'ENDS_WITH', '.io'), ['Charlie']],
    [cond('brief', 'CONTAINS', 'crm'), ['Alpha']],
  ])('%j finds %j', async (condition, names) => {
    expect(await leadsWhere(condition)).toEqual(names);
  });

  it('matches regular-expression characters literally', async () => {
    expect(await leadsWhere(cond('email', 'CONTAINS', '.*'))).toEqual([]);
  });

  it('needs a value', async () => {
    await expect(leadsWhere(cond('name', 'CONTAINS'))).rejects.toThrow('Enter a value for Name');
    await expect(leadsWhere(cond('name', 'EQ', '   '))).rejects.toThrow('Enter a value for Name');
  });
});

describe('number, date and yes/no conditions', () => {
  it.each([
    [cond('value', 'EQ', '10'), ['Bravo']],
    [cond('value', 'NEQ', '10'), ['Alpha', 'Charlie']],
    [cond('value', 'GT', '9'), ['Bravo', 'Charlie']],
    [cond('value', 'GTE', '10'), ['Bravo', 'Charlie']],
    [cond('value', 'LT', '10'), ['Alpha']],
    [cond('value', 'LTE', '10'), ['Alpha', 'Bravo']],
    [cond('value', 'BETWEEN', '9', '10'), ['Alpha', 'Bravo']],
    [cond('signed', 'BEFORE', '2026-02-01'), ['Alpha']],
    [cond('signed', 'AFTER', '2026-02-01'), ['Bravo']],
    [cond('signed', 'BETWEEN', '2026-01-01', '2026-12-31'), ['Alpha', 'Bravo']],
    [cond('vip', 'EQ', 'yes'), ['Alpha']],
    [cond('vip', 'EQ', 'no'), ['Bravo', 'Charlie']],
  ])('%j finds %j', async (condition, names) => {
    expect(await leadsWhere(condition)).toEqual(names);
  });

  it('compares numbers as numbers, not text', async () => {
    expect(await leadsWhere(cond('value', 'GT', '9'))).not.toContain('Alpha');
  });

  it('refuses a value that is not of the property type', async () => {
    await expect(leadsWhere(cond('value', 'GT', 'ten'))).rejects.toThrow(
      'Value "ten" is not a number',
    );
  });

  it('needs exactly two values for "between"', async () => {
    await expect(leadsWhere(cond('value', 'BETWEEN', '1'))).rejects.toThrow(
      'Value "between" needs two values',
    );
  });

  it('finds the records of the last N days', async () => {
    await LeadModel.create(lead('Delta', { custom: { signed: new Date() } }));
    expect(await leadsWhere(cond('signed', 'LAST_DAYS', '7'))).toEqual(['Delta']);
    expect(await leadsWhere(cond('signed', 'LAST_DAYS', '3650'))).toEqual([
      'Alpha',
      'Bravo',
      'Delta',
    ]);
  });

  it.each(['0', '3651', 'week'])('refuses %p days', async (days) => {
    await expect(leadsWhere(cond('signed', 'LAST_DAYS', days))).rejects.toThrow(
      'Signed: enter a number of days from 1 to 3650',
    );
  });
});

describe('choice, presence and emptiness conditions', () => {
  it.each([
    [cond('stage', 'IN', 'new', 'Won'), ['Alpha', 'Bravo']],
    [cond('stage', 'NOT_IN', 'NEW'), ['Bravo', 'Charlie']],
    [cond('tags', 'IN', 'Cold'), ['Bravo']],
    [cond('tags', 'NOT_IN', 'HOT'), ['Charlie']],
    [cond('notes', 'IS_EMPTY'), ['Bravo', 'Charlie']],
    [cond('notes', 'IS_NOT_EMPTY'), ['Alpha']],
    [cond('brief', 'IS_EMPTY'), ['Bravo', 'Charlie']],
  ])('%j finds %j', async (condition, names) => {
    expect(await leadsWhere(condition)).toEqual(names);
  });

  it('needs at least one choice', async () => {
    await expect(leadsWhere(cond('stage', 'IN'))).rejects.toThrow('Choose at least one Stage');
  });

  it('refuses a choice the property does not have', async () => {
    await expect(leadsWhere(cond('stage', 'IN', 'MAYBE'))).rejects.toThrow(
      'Stage "MAYBE" is not one of',
    );
  });

  it('finds contacts with or without any email address', async () => {
    await ContactModel.create([
      { name: 'Primary', email: 'p@acme.com' },
      { name: 'Listed', email: 'x@acme.com', emails: [{ address: 'l@acme.com' }] },
    ]);
    await ContactModel.collection.insertOne({ name: 'Nobody', email: '', status: 'ACTIVE' });
    const names = async (wanted: string) => {
      const { rows } = await searchRecords(
        'CONTACT',
        query({
          groups: [{ conditions: [cond('hasEmail', 'EQ', wanted)] }],
          sorts: [{ property: 'name', dir: 'ASC' }],
        }),
      );
      return rows.map(nameOf);
    };

    expect(await names('true')).toEqual(['Listed', 'Primary']);
    expect(await names('false')).toEqual(['Nobody']);
    await expect(names('maybe')).rejects.toThrow('Has email is Yes or No');
  });
});

describe('compileFilter', () => {
  let properties: Awaited<ReturnType<typeof propertyIndex>>;
  beforeEach(async () => {
    properties = await propertyIndex('LEAD');
  });
  const compile = (input: Pick<CrmQueryInput, 'search' | 'groups'>) =>
    compileFilter('LEAD', properties, input);

  it('is empty with no search and no conditions', () => {
    expect(compile({})).toEqual({});
    expect(compile({ search: '   ', groups: [{ conditions: [] }] })).toEqual({});
  });

  it('searches the object search paths with escaped text', () => {
    expect(compile({ search: ' a.b ' })).toEqual({
      $and: [{ $or: [{ name: /a\.b/i }, { email: /a\.b/i }, { owner: /a\.b/i }] }],
    });
  });

  it('matches any group, with every condition of a group', () => {
    const filter = compile({
      groups: [
        { conditions: [cond('value', 'GT', '1'), cond('notes', 'IS_NOT_EMPTY')] },
        { conditions: [cond('stage', 'IN', 'WON')] },
      ],
    });
    expect(filter).toEqual({
      $and: [
        {
          $or: [
            { $and: [{ value: { $gt: 1 } }, { notes: { $exists: true, $nin: [null, ''] } }] },
            { $and: [{ stage: { $in: ['WON'] } }] },
          ],
        },
      ],
    });
  });

  it.each([
    [
      'an unknown property',
      { groups: [{ conditions: [cond('budget', 'EQ', '1')] }] },
      'There is no property "budget"',
    ],
    [
      'an operator the type does not take',
      { groups: [{ conditions: [cond('value', 'CONTAINS', '1')] }] },
      'Value cannot be filtered with CONTAINS',
    ],
    [
      'too long a search',
      { search: 'x'.repeat(CRM_QUERY_LIMITS.maxSearch + 1) },
      'Search is limited to 100 characters',
    ],
    [
      'too many groups',
      { groups: Array.from({ length: 11 }, () => ({ conditions: [cond('notes', 'IS_EMPTY')] })) },
      'At most 10 filter groups',
    ],
    [
      'too many conditions in a group',
      { groups: [{ conditions: Array.from({ length: 21 }, () => cond('notes', 'IS_EMPTY')) }] },
      'At most 20 conditions in a group',
    ],
    [
      'too many values',
      {
        groups: [
          { conditions: [cond('stage', 'IN', ...Array.from({ length: 101 }, () => 'NEW'))] },
        ],
      },
      'At most 100 values in one condition',
    ],
    [
      'too long a value',
      { groups: [{ conditions: [cond('name', 'EQ', 'x'.repeat(201))] }] },
      'A filter value is limited to 200 characters',
    ],
  ])('refuses %s', (_why, input, message) => {
    expect(() => compile(input)).toThrow(message);
  });

  it('accepts the limits themselves', () => {
    const search = 'x'.repeat(CRM_QUERY_LIMITS.maxSearch);
    expect(() =>
      compile({ search, groups: [{ conditions: [cond('name', 'EQ', 'x'.repeat(200))] }] }),
    ).not.toThrow();
  });
});

describe('compileSort', () => {
  let properties: Awaited<ReturnType<typeof propertyIndex>>;
  beforeEach(async () => {
    properties = await propertyIndex('COMPANY');
  });

  it('sorts newest first when nothing is asked for, with _id last', () => {
    expect(compileSort(properties, null)).toEqual({ createdAt: -1, _id: -1 });
    expect(Object.keys(compileSort(properties, []))).toEqual(['createdAt', '_id']);
  });

  it('sorts by the asked columns in order', () => {
    expect(
      compileSort(properties, [
        { property: 'name', dir: 'ASC' },
        { property: 'updatedAt', dir: 'DESC' },
      ]),
    ).toEqual({ name: 1, updatedAt: -1, _id: -1 });
  });

  it('refuses too many columns, unknown columns and filter-only properties', () => {
    const name = { property: 'name', dir: 'ASC' } as const;
    expect(() => compileSort(properties, [name, name, name, name])).toThrow(
      'At most 3 sort columns',
    );
    expect(() => compileSort(properties, [{ property: 'nope', dir: 'ASC' }])).toThrow(
      'There is no property "nope"',
    );
    expect(() => compileSort(properties, [{ property: 'hasPhone', dir: 'ASC' }])).toThrow(
      'Has phone cannot be sorted on',
    );
  });
});

describe('searchRecords', () => {
  it('pages through the records with the total, ignoring case when sorting', async () => {
    await LeadModel.create(lead('aardvark'));
    const first = await searchRecords(
      'LEAD',
      query({ pageSize: 2, sorts: [{ property: 'name', dir: 'ASC' }] }),
    );
    const second = await searchRecords(
      'LEAD',
      query({ page: 1, pageSize: 2, sorts: [{ property: 'name', dir: 'ASC' }] }),
    );

    expect(first.totalCount).toBe(4);
    expect(first.rows.map(nameOf)).toEqual(['aardvark', 'Alpha']);
    expect(second.rows.map(nameOf)).toEqual(['Bravo', 'Charlie']);
    expect(typeof first.rows[0].id).toBe('string');
  });

  it('clamps the page size to 1..200 and a negative page to the first', async () => {
    expect((await searchRecords('LEAD', query({ pageSize: 0, page: -3 }))).rows).toHaveLength(1);
    await LeadModel.insertMany(Array.from({ length: 205 }, (_, i) => lead(`Bulk${i}`)));
    expect((await searchRecords('LEAD', query({ pageSize: 500 }))).rows).toHaveLength(200);
  });

  it('refuses a page too far in', async () => {
    await expect(searchRecords('LEAD', query({ page: 501, pageSize: 200 }))).rejects.toThrow(
      'That page is too far in',
    );
  });

  it('lists archived records only when asked', async () => {
    await LeadModel.updateOne({ name: 'Charlie' }, { archivedAt: new Date() });

    const live = await searchRecords('LEAD', query());
    const archived = await searchRecords('LEAD', query({ archived: true }));

    expect(live.totalCount).toBe(2);
    expect(archived.rows.map(nameOf)).toEqual(['Charlie']);
  });
});
