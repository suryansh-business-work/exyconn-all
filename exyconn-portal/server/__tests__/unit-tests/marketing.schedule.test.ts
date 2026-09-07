import { dispatchScheduledCampaigns, isDue } from '../../src/modules/marketing/marketing.schedule';
import { CampaignModel } from '../../src/modules/marketing/marketing.model';
import { AudienceListModel } from '../../src/modules/marketing/audience.model';
import { CampaignSendModel } from '../../src/modules/marketing/campaign-send.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { mailer } from '../../src/utils/mailer';

jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendCustomEmail: jest.fn() },
}));

const sendCustomEmail = mailer.sendCustomEmail as jest.Mock;

const NOW = new Date('2027-04-01T10:00:00.000Z');
const EARLIER = new Date('2027-04-01T09:00:00.000Z');
const LATER = new Date('2027-04-01T11:00:00.000Z');

describe('When a scheduled campaign is due', () => {
  it('is due once the moment has passed and there is an audience', () => {
    expect(isDue({ scheduledAt: EARLIER, scheduledAudienceListId: 'a1' }, NOW)).toBe(true);
  });

  it('is not due before its moment', () => {
    expect(isDue({ scheduledAt: LATER, scheduledAudienceListId: 'a1' }, NOW)).toBe(false);
  });

  it('is not due once it has been dispatched, however late the tick runs', () => {
    expect(
      isDue(
        { scheduledAt: EARLIER, scheduledAudienceListId: 'a1', scheduleDispatchedAt: EARLIER },
        NOW,
      ),
    ).toBe(false);
  });

  it('is not due with nowhere to send it', () => {
    expect(isDue({ scheduledAt: EARLIER, scheduledAudienceListId: '' }, NOW)).toBe(false);
  });

  it('is not due when nothing was scheduled at all', () => {
    expect(isDue({ scheduledAudienceListId: 'a1' }, NOW)).toBe(false);
  });
});

describe('Dispatching scheduled campaigns', () => {
  beforeEach(() => {
    sendCustomEmail.mockResolvedValue(undefined);
  });

  async function seedDueCampaign(scheduledAt: Date) {
    const client = await ClientModel.create({
      name: 'Ada',
      email: 'ada@example.com',
      phone: '000',
      company: 'Acme',
      status: 'ACTIVE',
    });
    const audience = await AudienceListModel.create({
      name: `Newsletter ${String(scheduledAt.getTime())}`,
      clientIds: [String(client._id)],
    });
    return CampaignModel.create({
      name: 'Spring newsletter',
      channel: 'EMAIL',
      budget: 100,
      startDate: new Date('2027-03-01'),
      endDate: new Date('2027-05-01'),
      status: 'ACTIVE',
      subject: 'Spring news',
      body: 'Hello {{name}}',
      scheduledAt,
      scheduledAudienceListId: String(audience._id),
    });
  }

  it('sends a campaign whose moment has passed and stamps it', async () => {
    const campaign = await seedDueCampaign(new Date(Date.now() - 60_000));

    await expect(dispatchScheduledCampaigns()).resolves.toBe(1);

    const saved = await CampaignModel.findById(campaign._id).lean();
    expect(saved?.scheduleDispatchedAt).toBeInstanceOf(Date);
    expect(saved?.lastSentAt).toBeInstanceOf(Date);
    expect(saved?.recipientsCount).toBe(1);
    expect(sendCustomEmail).toHaveBeenCalledTimes(1);
  });

  it('never sends the same campaign twice, however often the tick runs', async () => {
    const campaign = await seedDueCampaign(new Date(Date.now() - 60_000));

    await dispatchScheduledCampaigns();
    await expect(dispatchScheduledCampaigns()).resolves.toBe(0);

    expect(sendCustomEmail).toHaveBeenCalledTimes(1);
    await expect(
      CampaignSendModel.countDocuments({ campaignId: String(campaign._id) }),
    ).resolves.toBe(1);
  });

  it('leaves a campaign scheduled for later alone', async () => {
    await seedDueCampaign(new Date(Date.now() + 3_600_000));

    await expect(dispatchScheduledCampaigns()).resolves.toBe(0);
    expect(sendCustomEmail).not.toHaveBeenCalled();
  });

  it('keeps the claim when a send fails, so a broken campaign cannot loop', async () => {
    const campaign = await CampaignModel.create({
      name: 'Broken',
      channel: 'EMAIL',
      budget: 0,
      startDate: new Date('2027-03-01'),
      endDate: new Date('2027-05-01'),
      status: 'ACTIVE',
      subject: 'Hi',
      body: 'Hello',
      scheduledAt: new Date(Date.now() - 60_000),
      scheduledAudienceListId: 'no-such-audience-id',
    });

    await expect(dispatchScheduledCampaigns()).resolves.toBe(1);

    const saved = await CampaignModel.findById(campaign._id).lean();
    expect(saved?.scheduleDispatchedAt).toBeInstanceOf(Date);
    expect(saved?.lastSentAt).toBeNull();
  });
});
