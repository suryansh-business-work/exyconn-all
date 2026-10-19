import { marketingCustomResolvers } from '../../../../src/modules/marketing/marketing.resolvers';
import { marketingResolvers } from '../../../../src/modules/marketing';
import { AudienceListModel } from '../../../../src/modules/marketing/audience.model';
import { CampaignSendModel } from '../../../../src/modules/marketing/campaign-send.model';
import { LeadModel } from '../../../../src/modules/crm/crm.model';
import { portalOrigin } from '../../../../src/utils/portalOrigin';
import { Types } from 'mongoose';
import { asCrm, asEmployee, asMarketing, seedCampaign, seedClient } from './marketing.fixtures';

const Q = marketingCustomResolvers.Query;

const logRow = (campaignId: string, status: string, to: string) => ({
  campaignId,
  audienceListId: 'aud-1',
  to,
  status,
});

const seedLead = (email: string, campaignId: string, campaignName: string) =>
  LeadModel.create({
    name: email,
    email,
    value: 10,
    owner: 'sales@exyconn.com',
    campaignId,
    campaignName,
  });

describe('the marketing resolver map', () => {
  it('serves the campaign, audience and suppression CRUD next to the custom operations', () => {
    expect(Object.keys(marketingResolvers.Query)).toEqual(
      expect.arrayContaining([
        'listCampaignsPaged',
        'listAudienceListsPaged',
        'listMarketingSuppressionsPaged',
        'previewCampaignContent',
      ]),
    );
    expect(Object.keys(marketingResolvers.Mutation)).toEqual(
      expect.arrayContaining([
        'saveCampaignDraft',
        'queueCampaignSend',
        'unsubscribeFromMarketing',
      ]),
    );
  });
});

describe('campaignSendSummary', () => {
  it('counts sent, failed and skipped for one campaign only', async () => {
    await CampaignSendModel.create([
      logRow('c1', 'SENT', 'a@x.com'),
      logRow('c1', 'SENT', 'b@x.com'),
      logRow('c1', 'SKIPPED', 'c@x.com'),
      logRow('c2', 'FAILED', 'd@x.com'),
    ]);

    await expect(Q.campaignSendSummary(null, { campaignId: 'c1' }, asMarketing)).resolves.toEqual({
      sent: 2,
      failed: 0,
      skipped: 1,
    });
  });
});

describe('campaignOptions', () => {
  it('lists every campaign by name for a salesperson to attribute a lead to', async () => {
    const zeta = await seedCampaign({ name: 'Zeta launch' });
    const alpha = await seedCampaign({ name: 'Alpha launch' });

    await expect(Q.campaignOptions(null, {}, asCrm)).resolves.toEqual([
      { id: alpha._id.toHexString(), name: 'Alpha launch' },
      { id: zeta._id.toHexString(), name: 'Zeta launch' },
    ]);
  });

  it('is refused to somebody in neither marketing nor sales', async () => {
    await expect(Q.campaignOptions(null, {}, asEmployee)).rejects.toThrow(/access/);
  });
});

describe('campaignLeadCounts', () => {
  it('counts leads per campaign, most productive first, ignoring unattributed leads', async () => {
    await seedLead('a@x.com', 'c1', 'Spring');
    await seedLead('b@x.com', 'c2', 'Autumn');
    await seedLead('c@x.com', 'c2', 'Autumn');
    await seedLead('d@x.com', '', '');

    await expect(Q.campaignLeadCounts(null, {}, asMarketing)).resolves.toEqual([
      { campaignId: 'c2', campaignName: 'Autumn', leads: 2 },
      { campaignId: 'c1', campaignName: 'Spring', leads: 1 },
    ]);
  });

  it('reads an empty name for leads stored without one', async () => {
    await LeadModel.collection.insertOne({
      name: 'Old',
      email: 'old@x.com',
      value: 1,
      owner: 'sales@exyconn.com',
      campaignId: 'legacy',
    });

    await expect(Q.campaignLeadCounts(null, {}, asCrm)).resolves.toEqual([
      { campaignId: 'legacy', campaignName: '', leads: 1 },
    ]);
  });
});
