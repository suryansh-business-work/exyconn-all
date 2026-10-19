import { Types } from 'mongoose';
import { CrmPropertyModel } from '../../../../../src/modules/crm/records/crm-property.model';
import { LeadModel } from '../../../../../src/modules/crm/crm.model';
import { AuditLogModel } from '../../../../../src/modules/audit';
import {
  createProperties,
  deleteProperty,
  listProperties,
  updateProperty,
  type CrmPropertiesInput,
} from '../../../../../src/modules/crm/records/crm.properties';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { asArg } from '../../../../mockAs';

const ctx: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.CRM], email: 'asha@exyconn.com' },
};
const missingId = () => new Types.ObjectId().toHexString();

const input = (overrides: Partial<CrmPropertiesInput> = {}): CrmPropertiesInput => ({
  objects: ['LEAD'],
  key: 'tier',
  label: '  Tier  ',
  type: 'ENUM',
  options: [
    { value: ' GOLD ', label: ' Gold ' },
    { value: 'SILVER', label: 'Silver' },
  ],
  required: true,
  description: '  Account tier  ',
  ...overrides,
});

const options = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ value: `V${i}`, label: `Label ${i}` }));

afterEach(() => {
  jest.restoreAllMocks();
});

describe('creating a property', () => {
  it('stores the trimmed label, help text and choices', async () => {
    const [created] = await createProperties(ctx, input());

    expect(created).toEqual({
      id: expect.any(String),
      object: 'LEAD',
      key: 'tier',
      label: 'Tier',
      type: 'ENUM',
      options: [
        { value: 'GOLD', label: 'Gold' },
        { value: 'SILVER', label: 'Silver' },
      ],
      required: true,
      description: 'Account tier',
      order: 0,
    });
  });

  it('drops choices from a type that has none', async () => {
    const [created] = await createProperties(ctx, input({ type: 'NUMBER', key: 'score' }));
    expect(created.options).toEqual([]);
  });

  it.each([
    ['k', true],
    ['lead_score_2', true],
    ['a'.repeat(40), true],
    ['', false],
    ['  ', false],
    ['a'.repeat(41), false],
    ['2fast', false],
    ['_tier', false],
    ['Tier', false],
    ['tier-name', false],
    ['tier name', false],
  ])('%p is a usable key: %p', async (key, usable) => {
    const attempt = createProperties(ctx, input({ key, type: 'TEXT' }));
    if (usable) {
      await expect(attempt).resolves.toHaveLength(1);
    } else {
      await expect(attempt).rejects.toThrow('The key starts with a letter');
    }
  });

  it.each([
    ['no choices', { options: [] }, 'needs 1 to 100 choices'],
    ['over 100 choices', { options: options(101) }, 'needs 1 to 100 choices'],
    [
      'a choice without a value',
      { options: [{ value: ' ', label: 'Blank' }] },
      'Every choice needs a value',
    ],
    [
      'a choice without a label',
      { options: [{ value: 'A', label: '' }] },
      'Every choice needs a value',
    ],
    [
      'two choices with one value',
      {
        options: [
          { value: 'a', label: 'A' },
          { value: 'A ', label: 'B' },
        ],
      },
      'no two choices may share a value',
    ],
    ['a blank label', { label: '   ' }, 'Give the property a label of 1 to 80 characters'],
    ['a label over 80 characters', { label: 'x'.repeat(81) }, 'label of 1 to 80'],
    [
      'help text over 300 characters',
      { description: 'x'.repeat(301) },
      'limited to 300 characters',
    ],
  ])('refuses %s', async (_why, overrides, message) => {
    await expect(createProperties(ctx, input(overrides))).rejects.toThrow(message);
    expect(await CrmPropertyModel.countDocuments()).toBe(0);
  });

  it('accepts 100 choices, an 80-character label and 300 characters of help', async () => {
    const [created] = await createProperties(
      ctx,
      input({ options: options(100), label: 'x'.repeat(80), description: 'y'.repeat(300) }),
    );
    expect(created.options).toHaveLength(100);
  });

  it('needs a record type, and a key that is neither built in nor taken', async () => {
    await expect(createProperties(ctx, input({ objects: [] }))).rejects.toThrow(
      'Choose at least one record type for the property',
    );
    await expect(createProperties(ctx, input({ key: 'stage' }))).rejects.toThrow(
      '"stage" is already a built-in property of leads',
    );
    await createProperties(ctx, input());
    await expect(createProperties(ctx, input({ objects: ['CONTACT', 'LEAD'] }))).rejects.toThrow(
      'The leads already have a property with the key "tier"',
    );
    expect(await CrmPropertyModel.countDocuments({ object: 'CONTACT' })).toBe(0);
  });

  it('stops at 100 properties per record type', async () => {
    await CrmPropertyModel.insertMany(
      Array.from({ length: 100 }, (_, i) => ({
        object: 'COMPANY',
        key: `k${i}`,
        label: 'K',
        type: 'TEXT',
      })),
    );

    await expect(createProperties(ctx, input({ objects: ['COMPANY', 'LEAD'] }))).rejects.toThrow(
      'The companies already have 100 properties, the most a record type can have',
    );
    expect(await CrmPropertyModel.countDocuments({ object: 'LEAD' })).toBe(0);
  });

  it('takes back the rows already made when a colleague takes the key mid-way', async () => {
    const realCreate = CrmPropertyModel.create.bind(CrmPropertyModel);
    jest
      .spyOn(CrmPropertyModel, 'create')
      .mockImplementationOnce(asArg(realCreate))
      .mockRejectedValueOnce(Object.assign(new Error('E11000'), { code: 11000 }));

    await expect(createProperties(ctx, input({ objects: ['LEAD', 'CONTACT'] }))).rejects.toThrow(
      'A property with the key "tier" was added a moment ago. Try another key.',
    );
    expect(await CrmPropertyModel.countDocuments()).toBe(0);
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });

  it('passes any other write failure on, after taking the rows back', async () => {
    jest.spyOn(CrmPropertyModel, 'create').mockRejectedValueOnce(new Error('disk full'));

    await expect(createProperties(ctx, input())).rejects.toThrow('disk full');
    expect(await CrmPropertyModel.countDocuments()).toBe(0);
  });
});

describe('listing, changing and deleting a property', () => {
  it('lists a record type properties in order, reading old rows without their defaults', async () => {
    await createProperties(ctx, input());
    await CrmPropertyModel.collection.insertOne({
      object: 'LEAD',
      key: 'legacy',
      label: 'Legacy',
      type: 'TEXT',
      required: false,
      order: 5,
    });

    const listed = await listProperties('LEAD');

    expect(listed.map((p) => p.key)).toEqual(['tier', 'legacy']);
    expect(listed[1]).toMatchObject({ options: [], description: '' });
    expect(await listProperties('CONTACT')).toEqual([]);
  });

  it('changes the label, help, required flag and choices, keeping key and type, and audits it', async () => {
    const [created] = await createProperties(ctx, input());

    const changed = await updateProperty(ctx, created.id, {
      label: ' Level ',
      description: '',
      required: false,
      options: [{ value: 'PLATINUM', label: 'Platinum' }],
    });

    expect(changed).toMatchObject({
      key: 'tier',
      type: 'ENUM',
      label: 'Level',
      required: false,
      description: '',
      options: [{ value: 'PLATINUM', label: 'Platinum' }],
    });
    const audit = await AuditLogModel.findOne({ action: 'UPDATE' }).lean();
    expect(audit?.summary).toBe('Changed the Lead property "Level"');
  });

  it('refuses a change that breaks the rules', async () => {
    const [created] = await createProperties(ctx, input());
    await expect(
      updateProperty(ctx, created.id, {
        label: 'Tier',
        description: '',
        required: false,
        options: [],
      }),
    ).rejects.toThrow('needs 1 to 100 choices');
  });

  it('says when the property is gone, before or during the change', async () => {
    const update = { label: 'X', description: '', required: false, options: [] };
    await expect(updateProperty(ctx, missingId(), update)).rejects.toThrow('Property not found');

    const [created] = await createProperties(ctx, input({ type: 'TEXT', key: 'region' }));
    jest
      .spyOn(CrmPropertyModel, 'findByIdAndUpdate')
      .mockReturnValueOnce(asArg({ lean: () => Promise.resolve(null) }));
    await expect(updateProperty(ctx, created.id, update)).rejects.toThrow('Property not found');
  });

  it('deletes a property with its values on every record, and audits how many', async () => {
    const [created] = await createProperties(ctx, input());
    await LeadModel.create([
      { name: 'A', email: 'a@acme.com', value: 0, owner: 'Asha', custom: { tier: 'GOLD', x: 1 } },
      { name: 'B', email: 'b@acme.com', value: 0, owner: 'Asha', custom: { x: 2 } },
    ]);

    await expect(deleteProperty(ctx, created.id)).resolves.toBe(true);

    expect(await CrmPropertyModel.countDocuments()).toBe(0);
    const leads = await LeadModel.find().sort({ name: 1 }).lean();
    expect(leads.map((l) => l.custom)).toEqual([{ x: 1 }, { x: 2 }]);
    const audit = await AuditLogModel.findOne({ action: 'DELETE' }).lean();
    expect(audit?.summary).toBe('Deleted the Lead property "Tier" and its values on 1 records');
  });

  it('says when the property to delete is gone', async () => {
    await expect(deleteProperty(ctx, missingId())).rejects.toThrow('Property not found');
  });
});
