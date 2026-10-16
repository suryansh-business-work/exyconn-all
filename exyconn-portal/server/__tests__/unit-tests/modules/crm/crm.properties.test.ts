import { crmRecordsResolvers } from '../../../../src/modules/crm';
import { CrmPropertyModel } from '../../../../src/modules/crm/records/crm-property.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const asSales: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};

type Created = { id: string; object: string; key: string; label: string; order: number };

const property = (objects: string[], overrides: Record<string, unknown> = {}) => ({
  objects,
  key: 'lead_score',
  label: 'Lead score',
  type: 'NUMBER',
  options: [],
  required: false,
  description: '',
  ...overrides,
});

const createMany = (input: ReturnType<typeof property>) =>
  crmRecordsResolvers.Mutation.createCrmProperties(null, { input } as never, asSales) as Promise<
    Created[]
  >;

describe('creating a property on several record types', () => {
  it('makes one property per chosen type, each audited', async () => {
    const created = await createMany(property(['LEAD', 'COMPANY', 'CONTACT']));

    expect(created.map((row) => row.object)).toEqual(['LEAD', 'COMPANY', 'CONTACT']);
    expect(new Set(created.map((row) => row.key))).toEqual(new Set(['lead_score']));
    expect(await CrmPropertyModel.countDocuments({ key: 'lead_score' })).toBe(3);
    const audits = await AuditLogModel.find({ module: 'CrmProperty', action: 'CREATE' }).lean();
    expect(audits).toHaveLength(3);
  });

  it('adds a type only once when it is chosen twice', async () => {
    const created = await createMany(property(['COMPANY', 'COMPANY']));

    expect(created).toHaveLength(1);
    expect(await CrmPropertyModel.countDocuments({ object: 'COMPANY' })).toBe(1);
  });

  it('places each copy after the properties its type already has', async () => {
    await createMany(property(['CONTACT'], { key: 'first_touch', label: 'First touch' }));

    const created = await createMany(property(['LEAD', 'CONTACT']));

    const orderOf = (object: string) => created.find((row) => row.object === object)?.order;
    expect(orderOf('LEAD')).toBe(0);
    expect(orderOf('CONTACT')).toBe(1);
  });

  it('writes nothing when the key is already taken on any chosen type', async () => {
    await createMany(property(['CONTACT']));

    await expect(createMany(property(['LEAD', 'COMPANY', 'CONTACT']))).rejects.toThrow(
      'The contacts already have a property with the key "lead_score"',
    );
    expect(await CrmPropertyModel.countDocuments({ object: { $in: ['LEAD', 'COMPANY'] } })).toBe(0);
  });

  it('refuses a key that is built in on one of the chosen types', async () => {
    await expect(createMany(property(['LEAD', 'COMPANY'], { key: 'domain' }))).rejects.toThrow(
      '"domain" is already a built-in property of companies',
    );
    expect(await CrmPropertyModel.countDocuments()).toBe(0);
  });

  it('needs at least one record type', async () => {
    await expect(createMany(property([]))).rejects.toThrow(
      'Choose at least one record type for the property',
    );
  });

  it('keeps the single-type create working for older callers', async () => {
    const created = (await crmRecordsResolvers.Mutation.createCrmProperty(
      null,
      { input: { ...property([]), objects: undefined, object: 'LEAD' } } as never,
      asSales,
    )) as Created;

    expect(created).toMatchObject({ object: 'LEAD', key: 'lead_score', label: 'Lead score' });
  });
});
