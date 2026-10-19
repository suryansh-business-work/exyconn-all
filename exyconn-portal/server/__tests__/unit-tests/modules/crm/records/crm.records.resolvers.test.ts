import { Types } from 'mongoose';
import { crmRecordsResolvers } from '../../../../../src/modules/crm/records/crm.records.resolvers';
import { LeadModel } from '../../../../../src/modules/crm/crm.model';
import { CompanyModel } from '../../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import { CrmPropertyModel } from '../../../../../src/modules/crm/records/crm-property.model';
import { CrmViewModel } from '../../../../../src/modules/crm/records/crm-view.model';
import { AuditLogModel } from '../../../../../src/modules/audit';
import { registeredBulkTarget } from '../../../../../src/modules/table-transfer/registry';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';

const asSales: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.CRM], email: 'asha@exyconn.com' },
};
const asEmployee: GraphQLContext = {
  user: {
    id: new Types.ObjectId().toHexString(),
    roles: [ROLES.EMPLOYEE],
    email: 'dev@exyconn.com',
  },
};
const { Query, Mutation } = crmRecordsResolvers;

const propertyInput = {
  key: 'score',
  label: 'Score',
  type: 'NUMBER' as const,
  options: [],
  required: false,
  description: '',
};

const viewInput = (name: string) => ({
  object: 'LEAD' as const,
  name,
  shared: false,
  search: '',
  groups: [],
  sorts: [],
  columns: [],
});

describe('custom values on records', () => {
  it('gives an empty object for a record saved before custom properties existed', () => {
    expect(crmRecordsResolvers.Lead.custom({})).toEqual({});
    expect(crmRecordsResolvers.Company.custom({ custom: { tier: 'GOLD' } })).toEqual({
      tier: 'GOLD',
    });
    expect(crmRecordsResolvers.Contact.custom({ custom: null })).toEqual({});
  });
});

describe('queries', () => {
  it('describes an object with every property and the operators it takes', async () => {
    const schema = await Query.crmObjectSchema(null, { object: 'COMPANY' }, asSales);

    expect(schema.dedupeKey).toBe('domain');
    const hasPhone = schema.properties.find((p) => p.key === 'hasPhone');
    expect(hasPhone?.ops).toEqual(['EQ']);
    expect(schema.properties.find((p) => p.key === 'name')?.ops).toContain('CONTAINS');
  });

  it('searches each record type with its own list', async () => {
    await LeadModel.create({ name: 'Ravi', email: 'ravi@acme.com', value: 0, owner: 'A' });
    await CompanyModel.create({ name: 'Acme', domain: 'acme.com', owner: 'A' });
    await ContactModel.create({ name: 'Meera', email: 'meera@acme.com' });
    const page = { page: 0, pageSize: 10 };

    const leads = await Query.searchLeads(null, { query: page }, asSales);
    const companies = await Query.searchCompanies(null, { query: page }, asSales);
    const contacts = await Query.searchContacts(null, { query: page }, asSales);

    expect(
      [leads, companies, contacts].map((r) => r.rows.map((row) => Reflect.get(row, 'name'))),
    ).toEqual([['Ravi'], ['Acme'], ['Meera']]);
  });

  it('keeps every query to CRM roles', async () => {
    await expect(
      Query.searchLeads(null, { query: { page: 0, pageSize: 10 } }, asEmployee),
    ).rejects.toThrow();
    await expect(Query.crmObjectSchema(null, { object: 'LEAD' }, asEmployee)).rejects.toThrow();
    await expect(Query.crmProperties(null, { object: 'LEAD' }, asEmployee)).rejects.toThrow();
    await expect(Query.crmViews(null, { object: 'LEAD' }, asEmployee)).rejects.toThrow();
  });
});

describe('property mutations', () => {
  it('creates, lists, changes and deletes a property', async () => {
    const single = await Mutation.createCrmProperty(
      null,
      { input: { ...propertyInput, object: 'LEAD' } },
      asSales,
    );
    const many = await Mutation.createCrmProperties(
      null,
      { input: { ...propertyInput, key: 'tier', type: 'TEXT', objects: ['COMPANY', 'CONTACT'] } },
      asSales,
    );
    expect(many.map((p) => p.object)).toEqual(['COMPANY', 'CONTACT']);
    expect(
      (await Query.crmProperties(null, { object: 'LEAD' }, asSales)).map((p) => p.key),
    ).toEqual(['score']);

    const changed = await Mutation.updateCrmProperty(
      null,
      {
        id: single.id,
        input: { label: 'Lead score', options: [], required: true, description: '' },
      },
      asSales,
    );
    expect(changed).toMatchObject({ label: 'Lead score', required: true });

    await expect(Mutation.deleteCrmProperty(null, { id: single.id }, asSales)).resolves.toBe(true);
    expect(await CrmPropertyModel.countDocuments()).toBe(2);
  });

  it('keeps property changes to CRM roles', async () => {
    await expect(
      Mutation.createCrmProperty(null, { input: { ...propertyInput, object: 'LEAD' } }, asEmployee),
    ).rejects.toThrow();
    await expect(Mutation.deleteCrmProperty(null, { id: 'x' }, asEmployee)).rejects.toThrow();
  });
});

describe('view mutations', () => {
  it('creates, lists, changes and deletes a view', async () => {
    const created = await Mutation.createCrmView(null, { input: viewInput('Mine') }, asSales);
    expect((await Query.crmViews(null, { object: 'LEAD' }, asSales)).map((v) => v.name)).toEqual([
      'Mine',
    ]);

    const changed = await Mutation.updateCrmView(
      null,
      { id: created.id, input: viewInput('Renamed') },
      asSales,
    );
    expect(changed.name).toBe('Renamed');

    await expect(Mutation.deleteCrmView(null, { id: created.id }, asSales)).resolves.toBe(true);
    expect(await CrmViewModel.countDocuments()).toBe(0);
  });

  it('checks that the view exists before checking anything else', async () => {
    const id = new Types.ObjectId().toHexString();
    await expect(
      Mutation.updateCrmView(null, { id, input: viewInput('X') }, asSales),
    ).rejects.toThrow('View not found');
    await expect(Mutation.deleteCrmView(null, { id }, asSales)).rejects.toThrow('View not found');
  });
});

describe('importing records', () => {
  const rows = [{ name: 'Ravi', email: 'ravi@acme.com' }];

  it.each(['CREATE', 'UPDATE', 'UPSERT'] as const)(
    'imports in %s mode and audits the chunk',
    async (mode) => {
      const result = await Mutation.importCrmRecords(
        null,
        { input: { object: 'LEAD', mode, rows, firstRowNumber: 2 } },
        asSales,
      );

      const created = mode === 'UPDATE' ? 0 : 1;
      expect(result).toMatchObject({ created, skipped: 1 - created });
      const audit = await AuditLogModel.findOne({ action: 'IMPORT' }).lean();
      expect(audit).toMatchObject({
        module: 'Lead',
        entityLabel: 'leads rows 2-2',
        summary: `Imported leads (${mode}): ${created} created, 0 updated, ${1 - created} skipped, 0 failed`,
      });
    },
  );

  it.each(['CREATE', 'UPDATE', 'UPSERT'] as const)(
    'keeps %s imports to CRM roles',
    async (mode) => {
      await expect(
        Mutation.importCrmRecords(
          null,
          { input: { object: 'LEAD', mode, rows, firstRowNumber: 2 } },
          asEmployee,
        ),
      ).rejects.toThrow();
      expect(await LeadModel.countDocuments()).toBe(0);
    },
  );
});

describe('archiving from the grid', () => {
  it.each([
    ['searchLeads', 'Lead'],
    ['searchCompanies', 'Company'],
    ['searchContacts', 'Contact'],
  ])('opens %s to archiving its %s records', (list, entity) => {
    expect(registeredBulkTarget(list)?.entity).toBe(entity);
  });

  it('archives and restores records, auditing each', async () => {
    const lead = await LeadModel.create({
      name: 'Ravi',
      email: 'r@acme.com',
      value: 0,
      owner: 'A',
    });
    const archive = registeredBulkTarget('searchLeads')?.archive;
    const ids = [lead._id.toHexString()];

    expect(await archive?.(asSales, ids, true)).toBe(1);
    expect(await LeadModel.findById(lead._id).lean()).toMatchObject({
      archivedAt: expect.any(Date),
    });
    expect(await archive?.(asSales, ids, false)).toBe(1);
    expect(await LeadModel.findById(lead._id).lean()).toMatchObject({ archivedAt: null });
    expect(await AuditLogModel.countDocuments({ module: 'Lead', action: 'UPDATE' })).toBe(2);
  });

  it('refuses a caller without the CRM role', async () => {
    const archive = registeredBulkTarget('searchContacts')?.archive;
    await expect(archive?.(asEmployee, [], true)).rejects.toThrow();
  });
});
