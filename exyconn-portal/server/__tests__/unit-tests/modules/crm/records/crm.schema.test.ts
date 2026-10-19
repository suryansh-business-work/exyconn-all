import { CrmPropertyModel } from '../../../../../src/modules/crm/records/crm-property.model';
import { OBJECT_DEFS } from '../../../../../src/modules/crm/records/crm.objects';
import {
  customProperties,
  objectProperties,
  opsOf,
  OPS_BY_TYPE,
  propertyIndex,
} from '../../../../../src/modules/crm/records/crm.schema';

describe('opsOf', () => {
  it('gives a property the operators of its type', () => {
    const value = OBJECT_DEFS.LEAD.builtIns.find((p) => p.key === 'value');
    expect(value && opsOf(value)).toBe(OPS_BY_TYPE.NUMBER);
  });

  it('asks a filter-only Yes/No property only whether it equals Yes or No', () => {
    const hasEmail = OBJECT_DEFS.CONTACT.builtIns.find((p) => p.key === 'hasEmail');
    expect(hasEmail && opsOf(hasEmail)).toEqual(['EQ']);
  });
});

describe('custom properties', () => {
  it('lists a company property in display order, under custom.<key>', async () => {
    await CrmPropertyModel.create([
      {
        object: 'LEAD',
        key: 'tier',
        label: 'Tier',
        type: 'ENUM',
        order: 2,
        required: true,
        options: [{ value: 'GOLD', label: 'Gold' }],
        description: 'Account tier',
      },
      { object: 'LEAD', key: 'score', label: 'Score', type: 'NUMBER', order: 1 },
      { object: 'COMPANY', key: 'region', label: 'Region', type: 'TEXT', order: 0 },
    ]);

    const props = await customProperties('LEAD');

    expect(props).toEqual([
      {
        key: 'score',
        label: 'Score',
        type: 'NUMBER',
        options: [],
        required: false,
        builtIn: false,
        path: 'custom.score',
        importable: true,
        description: '',
        filterOnly: false,
      },
      expect.objectContaining({
        key: 'tier',
        options: [{ value: 'GOLD', label: 'Gold' }],
        required: true,
        description: 'Account tier',
      }),
    ]);
  });

  it('reads a row saved before options and help text existed', async () => {
    await CrmPropertyModel.collection.insertOne({
      object: 'CONTACT',
      key: 'legacy',
      label: 'Legacy',
      type: 'TEXT',
      required: false,
      order: 0,
    });

    const [legacy] = await customProperties('CONTACT');

    expect(legacy).toMatchObject({ key: 'legacy', options: [], description: '' });
  });

  it('puts the built-in properties first, then the company ones, indexed by key', async () => {
    await CrmPropertyModel.create({
      object: 'COMPANY',
      key: 'region',
      label: 'Region',
      type: 'TEXT',
    });

    const all = await objectProperties('COMPANY');
    const index = await propertyIndex('COMPANY');

    expect(all.slice(0, OBJECT_DEFS.COMPANY.builtIns.length)).toEqual(OBJECT_DEFS.COMPANY.builtIns);
    expect(all.at(-1)?.key).toBe('region');
    expect(index.get('domain')?.builtIn).toBe(true);
    expect(index.get('region')?.path).toBe('custom.region');
    expect(index.size).toBe(all.length);
  });
});
