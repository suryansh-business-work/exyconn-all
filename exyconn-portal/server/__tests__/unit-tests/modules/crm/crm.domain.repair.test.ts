import { CompanyModel } from '../../../../src/modules/crm/company.model';
import {
  allowBlankCompanyDomains,
  clearInventedCompanyDomains,
} from '../../../../src/modules/crm/crm.domain.repair';

const LEGACY = 'organizationId_1_domain_1';

const indexNames = async () =>
  (await CompanyModel.collection.indexes()).map((index) => String(index.name));

describe('company domain repairs', () => {
  it('drops the old unique domain index once the blank-tolerant one exists, and is safe to rerun', async () => {
    await CompanyModel.init();
    await CompanyModel.collection.createIndex(
      { organizationId: 1, domain: 1 },
      { unique: true, name: LEGACY },
    );

    await allowBlankCompanyDomains();
    await allowBlankCompanyDomains();

    const names = await indexNames();
    expect(names).not.toContain(LEGACY);
    expect(names).toContain('organizationId_1_domain_-1');
    await CompanyModel.create({ name: 'One', domain: '', owner: '' });
    await CompanyModel.create({ name: 'Two', domain: '', owner: '' });
    await CompanyModel.create({ name: 'Acme', domain: 'acme.example', owner: '' });
    await expect(
      CompanyModel.create({ name: 'Acme again', domain: 'acme.example', owner: '' }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('blanks only the domains the lead generator invented', async () => {
    await CompanyModel.init();
    await CompanyModel.create([
      { name: 'No site', domain: 'no-site-1f54edc0.no-website.invalid', owner: '' },
      { name: 'Other', domain: 'pets-paws-8a9b0c1d.no-website.invalid', owner: '' },
      { name: 'Real', domain: 'real.example', owner: '' },
    ]);

    await clearInventedCompanyDomains();
    await clearInventedCompanyDomains();

    const rows = await CompanyModel.find().sort({ name: 1 }).select('name domain').lean();
    expect(rows.map(({ name, domain }) => [name, domain])).toEqual([
      ['No site', ''],
      ['Other', ''],
      ['Real', 'real.example'],
    ]);
  });
});
