import { crmResolvers } from '../../src/modules/crm';
import { marketingCustomResolvers } from '../../src/modules/marketing/marketing.resolvers';
import { CampaignModel } from '../../src/modules/marketing/marketing.model';
import { LeadModel } from '../../src/modules/crm/crm.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const asCrm: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};
const asMarketing: GraphQLContext = {
  user: { id: 'user-2', roles: [ROLES.MARKETING], email: 'growth@exyconn.com' },
};

const seedCampaign = (name: string) =>
  CampaignModel.create({
    name,
    channel: 'EMAIL',
    budget: 100,
    startDate: new Date('2027-03-01'),
    endDate: new Date('2027-03-31'),
    status: 'ACTIVE',
  });

const leadInput = (over: Record<string, unknown> = {}) => ({
  name: 'Ada',
  email: 'ada@example.com',
  source: 'ADS',
  stage: 'NEW',
  value: 1000,
  owner: 'sales@exyconn.com',
  ...over,
});

const createLead = (input: Record<string, unknown>) =>
  crmResolvers.Mutation.createLead(null, { input } as never, asCrm) as Promise<{ id: string }>;

const leadsByCampaign = (campaignId: string) =>
  marketingCustomResolvers.Query.leadsByCampaign(null, { campaignId }, asMarketing);

describe('Attributing a lead to a campaign', () => {
  it('fills the campaign name in from the id, so a lead row reads without a join', async () => {
    const campaign = await seedCampaign('Spring newsletter');

    const created = await createLead(leadInput({ campaignId: String(campaign._id) }));

    const saved = await LeadModel.findById(created.id).lean();
    expect(saved?.campaignName).toBe('Spring newsletter');
  });

  it('ignores a name the caller tried to supply, so the two can never disagree', async () => {
    const campaign = await seedCampaign('Spring newsletter');

    const created = await createLead(
      leadInput({ campaignId: String(campaign._id), campaignName: 'Something else' }),
    );

    const saved = await LeadModel.findById(created.id).lean();
    expect(saved?.campaignName).toBe('Spring newsletter');
  });

  it('leaves both fields empty for a lead that came from nowhere in particular', async () => {
    const created = await createLead(leadInput());

    const saved = await LeadModel.findById(created.id).lean();
    expect(saved?.campaignId).toBe('');
    expect(saved?.campaignName).toBe('');
  });

  it('clears the attribution when an edit removes the campaign', async () => {
    const campaign = await seedCampaign('Spring newsletter');
    const created = await createLead(leadInput({ campaignId: String(campaign._id) }));

    await crmResolvers.Mutation.updateLead(
      null,
      { id: created.id, input: leadInput({ campaignId: '' }) } as never,
      asCrm,
    );

    const saved = await LeadModel.findById(created.id).lean();
    expect(saved?.campaignName).toBe('');
  });

  it('counts the leads one campaign produced, and only those', async () => {
    const [spring, autumn] = await Promise.all([
      seedCampaign('Spring newsletter'),
      seedCampaign('Autumn newsletter'),
    ]);
    await createLead(leadInput({ campaignId: String(spring._id) }));
    await createLead(leadInput({ email: 'bo@example.com', campaignId: String(spring._id) }));
    await createLead(leadInput({ email: 'cy@example.com', campaignId: String(autumn._id) }));
    await createLead(leadInput({ email: 'di@example.com' }));

    await expect(leadsByCampaign(String(spring._id))).resolves.toBe(2);
    await expect(leadsByCampaign(String(autumn._id))).resolves.toBe(1);
  });

  it('counts nothing for a campaign no lead came from', async () => {
    const campaign = await seedCampaign('Quiet campaign');

    await expect(leadsByCampaign(String(campaign._id))).resolves.toBe(0);
  });

  it('reads back an empty attribution for a lead written before the field existed', () => {
    expect(crmResolvers.Lead.campaignId({})).toBe('');
    expect(crmResolvers.Lead.campaignName({})).toBe('');
  });
});
