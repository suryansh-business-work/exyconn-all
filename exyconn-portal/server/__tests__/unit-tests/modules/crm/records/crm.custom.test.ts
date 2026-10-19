import { CrmPropertyModel } from '../../../../../src/modules/crm/records/crm-property.model';
import { sanitizeCustom } from '../../../../../src/modules/crm/records/crm.custom';

beforeEach(async () => {
  await CrmPropertyModel.create([
    { object: 'LEAD', key: 'score', label: 'Score', type: 'NUMBER', order: 0 },
    {
      object: 'LEAD',
      key: 'tier',
      label: 'Tier',
      type: 'ENUM',
      order: 1,
      options: [{ value: 'GOLD', label: 'Gold' }],
    },
    { object: 'LEAD', key: 'region', label: 'Region', type: 'TEXT', order: 2, required: true },
  ]);
});

describe('sanitizeCustom', () => {
  it('reads each value as its type and leaves blanks out', async () => {
    const custom = await sanitizeCustom('LEAD', { score: '1,200', tier: 'gold', region: ' APAC ' });
    expect(custom).toEqual({ score: 1200, tier: 'GOLD', region: 'APAC' });

    expect(await sanitizeCustom('LEAD', { score: '', region: 'EMEA' })).toEqual({
      region: 'EMEA',
    });
  });

  it('refuses a key the company never added', async () => {
    await expect(sanitizeCustom('LEAD', { region: 'EMEA', budget: 5 })).rejects.toThrow(
      'There is no property "budget"',
    );
  });

  it('refuses a value that is not of the property type', async () => {
    await expect(sanitizeCustom('LEAD', { region: 'EMEA', score: 'lots' })).rejects.toThrow(
      'Score "lots" is not a number',
    );
  });

  it('needs a value for a required property', async () => {
    await expect(sanitizeCustom('LEAD', { score: 3 })).rejects.toThrow('Region is required');
  });

  it.each([null, 'text', ['EMEA']])('treats %p as no values at all', async (raw) => {
    await expect(sanitizeCustom('LEAD', raw)).rejects.toThrow('Region is required');
  });

  it('returns nothing for a record type without custom properties', async () => {
    expect(await sanitizeCustom('CONTACT', undefined)).toEqual({});
  });
});
