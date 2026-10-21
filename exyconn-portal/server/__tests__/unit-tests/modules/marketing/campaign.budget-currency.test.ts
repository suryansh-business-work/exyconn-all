import { Types } from 'mongoose';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { repairStoredCurrencies } from '../../../../src/modules/organizations/organization.currency';
import { CampaignModel } from '../../../../src/modules/marketing/marketing.model';
import { saveDraft } from '../../../../src/modules/marketing/campaign.draft';
import { marketingResolvers } from '../../../../src/modules/marketing';
import type { TableStatsResult } from '../../../../src/utils/tableQuery';
import { asMarketing, seedCampaign } from './marketing.fixtures';

async function organization(slug: string, currency: string): Promise<string> {
  const created = await runAsPlatform(() =>
    OrganizationModel.create({ name: slug, slug, currency }),
  );
  return created._id.toHexString();
}

/** A campaign as releases before budgets had a currency wrote it: no `budgetCurrency` at all. */
async function legacyCampaign(organizationId: string): Promise<Types.ObjectId> {
  const _id = new Types.ObjectId();
  await CampaignModel.collection.insertOne({
    _id,
    organizationId: new Types.ObjectId(organizationId),
    name: 'Old launch',
    channel: 'EMAIL',
    budget: 5000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    status: 'COMPLETED',
  });
  return _id;
}

const storedCurrency = async (id: Types.ObjectId) =>
  (await CampaignModel.collection.findOne({ _id: id }))?.budgetCurrency;

describe('a campaign budget currency', () => {
  it('is required, stored upper-cased and refused when it is not ISO 4217', async () => {
    await expect(seedCampaign({ budgetCurrency: undefined })).rejects.toThrow(/budgetCurrency/);
    await expect(seedCampaign({ budgetCurrency: '₹' })).rejects.toThrow(/ISO 4217/);
    await expect(seedCampaign({ budgetCurrency: ' usd ' })).resolves.toMatchObject({
      budgetCurrency: 'USD',
    });
  });

  it('is the company currency on a new draft that names none, and kept on later saves', async () => {
    const acme = await organization('acme', 'EUR');

    const created = await runForOrganization(acme, () =>
      saveDraft(null, { name: 'Autumn offer', budget: 1200 }, null),
    );
    expect(created).toMatchObject({ budget: 1200, budgetCurrency: 'EUR' });

    const updated = await runForOrganization(acme, () =>
      saveDraft(String(created._id), { name: 'Autumn offer', budget: 900 }, 1),
    );
    expect(updated).toMatchObject({ budget: 900, budgetCurrency: 'EUR' });
  });

  it('is the one the draft names, refusing one that is not a currency', async () => {
    const acme = await organization('acme', 'EUR');

    const created = await runForOrganization(acme, () =>
      saveDraft(null, { name: 'US launch', budgetCurrency: 'usd' }, null),
    );
    expect(created.budgetCurrency).toBe('USD');

    await expect(
      runForOrganization(acme, () =>
        saveDraft(null, { name: 'Bad', budgetCurrency: 'Rupee' }, null),
      ),
    ).rejects.toThrow('Choose a valid ISO 4217 currency.');
  });

  it('is filled in at boot with the company currency on campaigns saved without one', async () => {
    const acme = await organization('acme', 'EUR');
    const globex = await organization('globex', 'USD');
    const old = await legacyCampaign(acme);
    const theirs = await legacyCampaign(globex);
    const current = await runForOrganization(acme, () => seedCampaign({ budgetCurrency: 'GBP' }));

    expect(await runForOrganization(acme, repairStoredCurrencies)).toBe(1);

    expect(await storedCurrency(old)).toBe('EUR');
    expect(await storedCurrency(current._id)).toBe('GBP');
    expect(await storedCurrency(theirs)).toBeUndefined();
    // A second boot has nothing left to do.
    expect(await runForOrganization(acme, repairStoredCurrencies)).toBe(0);
  });
});

describe('the campaign stats', () => {
  it('count budgets by currency next to their sum', async () => {
    await seedCampaign({ budget: 100, budgetCurrency: 'INR' });
    await seedCampaign({ budget: 200, budgetCurrency: 'INR' });
    await seedCampaign({ budget: 50, budgetCurrency: 'USD' });

    const listStats = (marketingResolvers.Query as Record<string, unknown>).listCampaignsStats as (
      parent: null,
      args: object,
      ctx: typeof asMarketing,
    ) => Promise<TableStatsResult>;
    const stats = await listStats(null, {}, asMarketing);

    const currencies = stats.counts.find((entry) => entry.field === 'budgetCurrency');
    expect(currencies?.buckets).toHaveLength(2);
    expect(currencies?.buckets).toEqual(
      expect.arrayContaining([
        { value: 'INR', count: 2 },
        { value: 'USD', count: 1 },
      ]),
    );
    expect(stats.sums).toEqual([{ field: 'budget', total: 350 }]);
  });
});
