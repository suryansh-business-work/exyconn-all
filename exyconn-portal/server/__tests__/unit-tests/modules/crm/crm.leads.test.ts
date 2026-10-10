import { print } from 'graphql';
import { crmResolvers, crmTypeDefs, crmEntitiesTypeDefs } from '../../../../src/modules/crm';
import { LeadModel } from '../../../../src/modules/crm/crm.model';
import { CampaignModel } from '../../../../src/modules/marketing/marketing.model';
import { emitWebhookBestEffort } from '../../../../src/modules/integrations';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

// Webhook delivery is an outbound side effect; the announcement itself is what is asserted.
jest.mock('../../../../src/modules/integrations', () => ({
  ...jest.requireActual('../../../../src/modules/integrations'),
  emitWebhookBestEffort: jest.fn(),
}));

const emitted = jest.mocked(emitWebhookBestEffort);
const asCrm: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};
const asEmployee: GraphQLContext = {
  user: { id: 'user-2', roles: [ROLES.EMPLOYEE], email: 'dev@exyconn.com' },
};

const leadInput = (over: Record<string, unknown> = {}) => ({
  name: 'Priya Nair',
  email: 'Priya@Acme.com',
  source: 'REFERRAL',
  stage: 'NEW',
  value: 5000,
  owner: 'Asha',
  ...over,
});

type LeadRow = { id: string; email: string; campaignName: string; stage: string };

const createLead = (input: Record<string, unknown>, ctx: GraphQLContext = asCrm) =>
  crmResolvers.Mutation.createLead(null, { input } as never, ctx) as Promise<LeadRow>;

describe('filing a lead', () => {
  it('announces the lead with its attribution, empty when it came from no campaign', async () => {
    const lead = await createLead(leadInput());

    expect(lead.email).toBe('priya@acme.com');
    expect(emitted).toHaveBeenCalledWith('lead.created', {
      leadId: lead.id,
      name: 'Priya Nair',
      email: 'priya@acme.com',
      source: 'REFERRAL',
      stage: 'NEW',
      value: 5000,
      owner: 'Asha',
      campaignId: '',
      campaignName: '',
    });
  });

  it('announces the campaign it came from by id and by name', async () => {
    const campaign = await CampaignModel.create({
      name: 'Autumn webinar',
      channel: 'EMAIL',
      budget: 100,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-31'),
      status: 'ACTIVE',
    });

    await createLead(leadInput({ campaignId: campaign._id.toHexString() }));

    expect(emitted).toHaveBeenCalledWith(
      'lead.created',
      expect.objectContaining({
        campaignId: campaign._id.toHexString(),
        campaignName: 'Autumn webinar',
      }),
    );
  });

  it('refuses somebody outside the CRM role and announces nothing', async () => {
    await expect(createLead(leadInput(), asEmployee)).rejects.toThrow();

    expect(emitted).not.toHaveBeenCalled();
    await expect(LeadModel.countDocuments()).resolves.toBe(0);
  });

  it('saves an edit without announcing a new lead', async () => {
    const lead = await createLead(leadInput());
    emitted.mockClear();

    const updated = (await crmResolvers.Mutation.updateLead(
      null,
      { id: lead.id, input: leadInput({ stage: 'CONTACTED' }) } as never,
      asCrm,
    )) as LeadRow;

    expect(updated.stage).toBe('CONTACTED');
    expect(emitted).not.toHaveBeenCalled();
  });
});

describe('reading a lead', () => {
  it('reads stored attribution back unchanged', () => {
    const lead = { campaignId: 'cmp-1', campaignName: 'Autumn webinar' };

    expect(crmResolvers.Lead.campaignId(lead)).toBe('cmp-1');
    expect(crmResolvers.Lead.campaignName(lead)).toBe('Autumn webinar');
  });

  it('declares the mutations the resolvers implement', () => {
    expect(print(crmTypeDefs)).toContain('convertLead(id: ID!, input: ConvertLeadInput!): Deal!');
    expect(print(crmEntitiesTypeDefs)).toContain('setDealStage(id: ID!, stage: DealStage!): Deal!');
  });
});
