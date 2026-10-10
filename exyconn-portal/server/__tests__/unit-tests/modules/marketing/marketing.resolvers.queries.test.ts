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
        'campaignPreview',
      ]),
    );
    expect(Object.keys(marketingResolvers.Mutation)).toEqual(
      expect.arrayContaining(['createCampaign', 'sendCampaign', 'unsubscribeFromMarketing']),
    );
    expect(marketingResolvers.AudienceList).toBe(marketingCustomResolvers.AudienceList);
  });
});

describe('audienceMembers', () => {
  it('resolves who a saved audience reaches right now', async () => {
    const client = await seedClient('Ada', 'Ada@Example.com');
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      clientIds: [client._id.toHexString()],
    });

    const members = await Q.audienceMembers(null, { id: audience._id.toHexString() }, asMarketing);

    expect(members).toEqual([
      expect.objectContaining({ email: 'ada@example.com', name: 'Ada', kind: 'CLIENT' }),
    ]);
  });

  it('refuses an audience that does not exist', async () => {
    const id = new Types.ObjectId().toHexString();

    await expect(Q.audienceMembers(null, { id }, asMarketing)).rejects.toThrow(
      'Audience list not found',
    );
  });

  it('is refused to somebody outside marketing', async () => {
    await expect(Q.audienceMembers(null, { id: 'x' }, asCrm)).rejects.toThrow(/access/);
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

describe('campaignPreview', () => {
  const preview = (id: string, audienceListId: string, origin?: string) =>
    Q.campaignPreview(null, { id, audienceListId }, { ...asMarketing, origin });

  it('renders the first member’s copy with a placeholder unsubscribe link', async () => {
    const campaign = await seedCampaign();
    const client = await seedClient('Ada', 'ada@example.com');
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      clientIds: [client._id.toHexString()],
    });
    const origin = 'https://spoofed.example';

    const rendered = await preview(campaign._id.toHexString(), audience._id.toHexString(), origin);

    expect(rendered).toEqual({
      recipient: 'ada@example.com',
      subject: 'Hello Ada',
      body: `Dear Ada of Acme\n\nUnsubscribe: ${portalOrigin(origin)}/unsubscribe?t=preview`,
    });
  });

  it('has nothing to show for an audience with nobody in it', async () => {
    const campaign = await seedCampaign();
    const audience = await AudienceListModel.create({ name: 'Empty' });

    await expect(
      preview(campaign._id.toHexString(), audience._id.toHexString()),
    ).resolves.toBeNull();
  });

  it('refuses a campaign that does not exist', async () => {
    const audience = await AudienceListModel.create({ name: 'Empty' });

    await expect(
      preview(new Types.ObjectId().toHexString(), audience._id.toHexString()),
    ).rejects.toThrow('Campaign not found');
  });

  it('refuses an audience that does not exist', async () => {
    const campaign = await seedCampaign();

    await expect(
      preview(campaign._id.toHexString(), new Types.ObjectId().toHexString()),
    ).rejects.toThrow('Audience list not found');
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
