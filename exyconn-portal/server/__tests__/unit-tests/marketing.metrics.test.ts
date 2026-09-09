import { CampaignSendModel } from '../../src/modules/marketing/campaign-send.model';
import { CampaignClickModel } from '../../src/modules/marketing/campaign-click.model';
import { campaignMetricsFor } from '../../src/modules/marketing/marketing.metrics';

const CAMPAIGN = 'camp-1';

async function send(to: string, extra: Record<string, unknown> = {}) {
  return CampaignSendModel.create({
    campaignId: CAMPAIGN,
    audienceListId: 'aud-1',
    to,
    status: 'SENT',
    sentAt: new Date(),
    ...extra,
  });
}

describe('campaign metrics', () => {
  it('reports nothing for a campaign that has not been sent', async () => {
    const metrics = await campaignMetricsFor(CAMPAIGN);

    expect(metrics.sent).toBe(0);
    // Never divides by zero into NaN — a rate with nothing behind it is 0.
    expect(metrics.openRate).toBe(0);
    expect(metrics.clickThroughRate).toBe(0);
  });

  it('counts distinct openers, not opens, for the rate', async () => {
    await send('a@x.com', { openedAt: new Date(), openCount: 5 });
    await send('b@x.com');

    const metrics = await campaignMetricsFor(CAMPAIGN);

    expect(metrics.sent).toBe(2);
    // One PERSON opened, five times. A rate built on total opens would read 250%.
    expect(metrics.opened).toBe(1);
    expect(metrics.totalOpens).toBe(5);
    expect(metrics.openRate).toBe(50);
  });

  it('counts distinct clickers and their clicks', async () => {
    await send('a@x.com', { openedAt: new Date(), openCount: 1, clickCount: 3 });
    await send('b@x.com', { openedAt: new Date(), openCount: 1 });

    const metrics = await campaignMetricsFor(CAMPAIGN);

    expect(metrics.clicked).toBe(1);
    expect(metrics.totalClicks).toBe(3);
    expect(metrics.clickRate).toBe(50);
    // Of the two who opened, one clicked.
    expect(metrics.clickThroughRate).toBe(50);
  });

  it('ignores recipients the send skipped or failed', async () => {
    await send('a@x.com', { openedAt: new Date(), openCount: 1 });
    await CampaignSendModel.create({
      campaignId: CAMPAIGN,
      audienceListId: 'aud-1',
      to: 'skipped@x.com',
      status: 'SKIPPED',
      error: 'unsubscribed',
      sentAt: new Date(),
    });

    const metrics = await campaignMetricsFor(CAMPAIGN);

    // A rate measured against people who were never written to is not a rate.
    expect(metrics.sent).toBe(1);
    expect(metrics.openRate).toBe(100);
  });

  it("keeps one campaign's numbers out of another's", async () => {
    await send('a@x.com', { openedAt: new Date(), openCount: 1 });
    await CampaignSendModel.create({
      campaignId: 'other',
      audienceListId: 'aud-1',
      to: 'c@x.com',
      status: 'SENT',
      openCount: 99,
      openedAt: new Date(),
      sentAt: new Date(),
    });

    expect((await campaignMetricsFor(CAMPAIGN)).totalOpens).toBe(1);
  });

  it('records a click against the link it was on', async () => {
    const row = await send('a@x.com');
    await CampaignClickModel.create({
      campaignId: CAMPAIGN,
      sendId: String(row._id),
      to: 'a@x.com',
      url: 'https://example.com/offer',
    });

    const clicks = await CampaignClickModel.find({ campaignId: CAMPAIGN }).lean();
    expect(clicks).toHaveLength(1);
    expect(clicks[0].url).toBe('https://example.com/offer');
  });
});
