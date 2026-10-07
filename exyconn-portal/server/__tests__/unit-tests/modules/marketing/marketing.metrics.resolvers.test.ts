import {
  campaignMetricsFor,
  marketingMetricsResolvers,
  marketingMetricsTypeDefs,
  marketingTypeDefs,
} from '../../../../src/modules/marketing';
import { print } from 'graphql';
import { CampaignSendModel } from '../../../../src/modules/marketing/campaign-send.model';
import { CampaignClickModel } from '../../../../src/modules/marketing/campaign-click.model';
import { asCrm, asMarketing } from './marketing.fixtures';

const Q = marketingMetricsResolvers.Query;
const CAMPAIGN = 'camp-1';

const click = (to: string, url: string, campaignId = CAMPAIGN) =>
  CampaignClickModel.create({ campaignId, sendId: 'send-1', to, url });

describe('campaignMetrics', () => {
  it('reports the same numbers the metrics service computes', async () => {
    await CampaignSendModel.create({
      campaignId: CAMPAIGN,
      audienceListId: 'aud-1',
      to: 'a@x.com',
      status: 'SENT',
      openedAt: new Date(),
      openCount: 2,
      clickCount: 1,
    });

    const metrics = await Q.campaignMetrics(null, { campaignId: CAMPAIGN }, asMarketing);

    expect(metrics).toEqual(await campaignMetricsFor(CAMPAIGN));
    expect(metrics).toMatchObject({ sent: 1, opened: 1, clicked: 1, clickThroughRate: 100 });
  });

  it('is refused to somebody outside marketing', async () => {
    await expect(Q.campaignMetrics(null, { campaignId: CAMPAIGN }, asCrm)).rejects.toThrow(
      /access/,
    );
  });
});

describe('campaignTopLinks', () => {
  it('ranks links by clicks and counts distinct people for each', async () => {
    await click('a@x.com', 'https://example.com/offer');
    await click('a@x.com', 'https://example.com/offer');
    await click('b@x.com', 'https://example.com/offer');
    await click('a@x.com', 'https://example.com/blog');
    await click('c@x.com', 'https://example.com/other', 'camp-2');

    await expect(Q.campaignTopLinks(null, { campaignId: CAMPAIGN }, asMarketing)).resolves.toEqual([
      { url: 'https://example.com/offer', clicks: 3, people: 2 },
      { url: 'https://example.com/blog', clicks: 1, people: 1 },
    ]);
  });

  it('has no links for a campaign nobody clicked', async () => {
    await expect(Q.campaignTopLinks(null, { campaignId: CAMPAIGN }, asMarketing)).resolves.toEqual(
      [],
    );
  });

  it('is refused to somebody outside marketing', async () => {
    await expect(Q.campaignTopLinks(null, { campaignId: CAMPAIGN }, asCrm)).rejects.toThrow(
      /access/,
    );
  });
});

describe('the marketing schema', () => {
  it('declares the operations the resolvers serve', () => {
    const schema = [marketingTypeDefs, marketingMetricsTypeDefs].map(print).join('\n');

    for (const operation of [
      'sendCampaign',
      'campaignPreview',
      'unsubscribeFromMarketing',
      'campaignMetrics',
      'campaignTopLinks',
    ]) {
      expect(schema).toContain(operation);
    }
  });
});
