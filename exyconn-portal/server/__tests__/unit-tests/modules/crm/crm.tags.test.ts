import { ROLES } from '../../../../src/constants/roles';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { tagFields } from '../../../../src/modules/crm/crm.tag-fields';
import { crmTagResolvers } from '../../../../src/modules/crm/crm.tags';
import { RolePermissionModel } from '../../../../src/modules/permissions/permission.model';
import { crmUser } from '../crm-integrations/fixtures';

const MISSING_ID = '64b7f0c2a1b2c3d4e5f60718';
const LIMITS = 'Use up to 20 tags of at most 40 characters each.';
const { Query, Mutation } = crmTagResolvers;

const company = () => CompanyModel.create({ name: 'Acme', domain: 'acme.com', owner: 'A' });
const contact = () => ContactModel.create({ name: 'Asha', email: 'asha@acme.com', owner: 'A' });

afterEach(() => {
  invalidatePermissionCache();
});

describe('setting tags', () => {
  it('keeps trimmed tags once each, whatever their case, on a company', async () => {
    const acme = await company();

    const tags = await Mutation.setCrmTags(
      null,
      { object: 'COMPANY', id: acme.id, tags: [' Hot ', 'hot', '', 'Partner referral'] },
      crmUser(),
    );

    expect(tags).toEqual(['Hot', 'Partner referral']);
    expect((await CompanyModel.findById(acme.id).lean())?.tags).toEqual([
      'Hot',
      'Partner referral',
    ]);
  });

  it('replaces the tags of a contact', async () => {
    const asha = await contact();
    await Mutation.setCrmTags(null, { object: 'CONTACT', id: asha.id, tags: ['Old'] }, crmUser());

    await expect(
      Mutation.setCrmTags(null, { object: 'CONTACT', id: asha.id, tags: ['New'] }, crmUser()),
    ).resolves.toEqual(['New']);
  });

  it('refuses more than 20 tags or a tag over 40 characters', async () => {
    const asha = await contact();
    const many = Array.from({ length: 21 }, (_v, n) => `Tag ${n}`);

    await expect(
      Mutation.setCrmTags(null, { object: 'CONTACT', id: asha.id, tags: many }, crmUser()),
    ).rejects.toThrow(LIMITS);
    await expect(
      Mutation.setCrmTags(
        null,
        { object: 'CONTACT', id: asha.id, tags: ['x'.repeat(41)] },
        crmUser(),
      ),
    ).rejects.toThrow(LIMITS);
  });

  it('says which record is missing', async () => {
    await expect(
      Mutation.setCrmTags(null, { object: 'COMPANY', id: MISSING_ID, tags: [] }, crmUser()),
    ).rejects.toThrow('Company not found');
    await expect(
      Mutation.setCrmTags(null, { object: 'CONTACT', id: MISSING_ID, tags: [] }, crmUser()),
    ).rejects.toThrow('Contact not found');
  });

  it('needs EDIT on the kind of record', async () => {
    await RolePermissionModel.create({ role: ROLES.CRM, module: 'Contact', actions: ['VIEW'] });
    const asha = await contact();

    await expect(
      Mutation.setCrmTags(null, { object: 'CONTACT', id: asha.id, tags: ['Hot'] }, crmUser()),
    ).rejects.toThrow('Your role may not edit Contact');
  });
});

describe('tags in use', () => {
  it('lists each kind of record’s tags once, sorted, without blanks', async () => {
    await CompanyModel.collection.insertMany([
      { name: 'A', domain: 'a.co', owner: 'A', tags: ['Partner', 'Hot'] },
      { name: 'B', domain: 'b.co', owner: 'A', tags: ['Hot', ''] },
    ]);
    await ContactModel.create({ name: 'Asha', email: 'a@a.co', owner: 'A', tags: ['Champion'] });

    await expect(Query.crmTags(null, { object: 'COMPANY' }, crmUser())).resolves.toEqual([
      'Hot',
      'Partner',
    ]);
    await expect(Query.crmTags(null, { object: 'CONTACT' }, crmUser())).resolves.toEqual([
      'Champion',
    ]);
  });

  it('reads a record saved before tags existed as untagged', () => {
    expect(crmTagResolvers.Company.tags({})).toEqual([]);
    expect(crmTagResolvers.Contact.tags({ tags: ['Hot'] })).toEqual(['Hot']);
    expect(tagFields.tags.default).toEqual([]);
  });

  it('gives both kinds of record a tags field, whichever model loads first', () => {
    expect(CompanyModel.schema.path('tags')).toBeDefined();
    expect(ContactModel.schema.path('tags')).toBeDefined();
  });
});
