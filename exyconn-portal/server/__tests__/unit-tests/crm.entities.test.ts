import { companiesService, contactsService, dealsService } from '../../src/modules/crm';
import { CompanyModel } from '../../src/modules/crm/company.model';
import { DealModel } from '../../src/modules/crm/deal.model';

/** The shared CRUD service returns a lean document, so the id is read back explicitly. */
const idOf = (doc: unknown) => String((doc as { _id: unknown })._id);

const company = {
  name: 'Acme Ltd',
  domain: 'acme.com',
  size: '11-50',
  status: 'PROSPECT',
  owner: 'Asha Rao',
};

const deal = {
  title: 'Acme platform rollout',
  stage: 'QUALIFYING',
  value: 250000,
  probability: 20,
  owner: 'Asha Rao',
};

describe('CRM accounts, contacts and deals', () => {
  // Mongoose builds indexes in the background after connecting, so the unique
  // index on `domain` is not necessarily there when the first test runs. `init()`
  // resolves once it is — without this the duplicate simply saves.
  beforeAll(async () => {
    await CompanyModel.init();
  });

  it('refuses a second company on the same domain', async () => {
    await companiesService.create(company);

    await expect(companiesService.create({ ...company, name: 'Acme Limited' })).rejects.toThrow();
  });

  it('defaults a company to prospect and keeps its owner', async () => {
    const created = await companiesService.create(company);

    const saved = await CompanyModel.findById(idOf(created)).lean();
    expect(saved?.status).toBe('PROSPECT');
    expect(saved?.owner).toBe('Asha Rao');
  });

  it('carries the company name onto a contact so a row reads without a join', async () => {
    const account = await companiesService.create(company);

    const contact = await contactsService.create({
      name: 'Ravi Kumar',
      email: 'ravi@acme.com',
      companyId: idOf(account),
      companyName: 'Acme Ltd',
      status: 'ACTIVE',
      owner: 'Asha Rao',
    });

    expect((contact as { companyName: string }).companyName).toBe('Acme Ltd');
  });

  it('starts a deal in the first pipeline stage', async () => {
    const created = await dealsService.create(deal);

    const saved = await DealModel.findById(idOf(created)).lean();
    expect(saved?.stage).toBe('QUALIFYING');
    expect(saved?.value).toBe(250000);
  });

  it('rejects a probability outside 0-100', async () => {
    await expect(dealsService.create({ ...deal, probability: 140 })).rejects.toThrow();
  });

  it('rejects an unknown pipeline stage', async () => {
    await expect(dealsService.create({ ...deal, stage: 'ALMOST' })).rejects.toThrow();
  });
});
