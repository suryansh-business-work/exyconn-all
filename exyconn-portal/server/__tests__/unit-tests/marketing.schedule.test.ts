import { randomUUID } from 'node:crypto';
import { dispatchScheduledCampaigns, isDue } from '../../src/modules/marketing/marketing.schedule';
import { CampaignModel } from '../../src/modules/marketing/marketing.model';
import { AudienceListModel } from '../../src/modules/marketing/audience.model';
import { CampaignSendModel } from '../../src/modules/marketing/campaign-send.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { EmailConfigModel } from '../../src/modules/tech/email-config.model';
import { mailer } from '../../src/utils/mailer';

jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendMarketingEmail: jest.fn() },
}));

const sendMarketingEmail = mailer.sendMarketingEmail as jest.Mock;
const SENDER = 'news@exyconn.com';

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

/** The active SMTP configuration: its from address is the one a campaign may send as. */
const activeSmtp = () =>
  EmailConfigModel.create({
    label: 'SMTP',
    host: 'smtp.example.com',
    port: 465,
    secure: true,
    username: 'mailer',
    password: randomUUID(),
    fromAddress: `Exyconn <${SENDER}>`,
    isActive: true,
  });

async function seedDueCampaign(scheduledAt: Date) {
  await activeSmtp();
  const client = await ClientModel.create({
    name: 'Ada',
    email: 'ada@example.com',
    phone: '000',
    company: 'Acme',
    status: 'ACTIVE',
  });
  const audience = await AudienceListModel.create({
    name: `Newsletter ${String(scheduledAt.getTime())}`,
    recipientSource: 'SELECTED_ONLY',
    clientIds: [client._id.toHexString()],
  });
  return CampaignModel.create({
    name: 'Spring newsletter',
    channel: 'EMAIL',
    budget: 100,
    budgetCurrency: 'INR',
    startDate: new Date('2027-03-01'),
    endDate: new Date('2027-05-01'),
    status: 'ACTIVE',
    subject: 'Spring news',
    preheader: 'What is new this spring',
    senderName: 'Exyconn',
    senderEmail: SENDER,
    mjml: '<mjml><mj-body><mj-section><mj-column><mj-text>Spring is here.</mj-text></mj-column></mj-section></mj-body></mjml>',
    scheduledAt,
    scheduledAudienceListId: audience._id.toHexString(),
  });
}

describe('Dispatching scheduled campaigns', () => {
  beforeEach(() => {
    sendMarketingEmail.mockResolvedValue(undefined);
  });

  it('sends a campaign whose moment has passed and stamps it', async () => {
    const campaign = await seedDueCampaign(new Date(Date.now() - 60_000));

    await expect(dispatchScheduledCampaigns()).resolves.toBe(1);

    const saved = await CampaignModel.findById(campaign._id).lean();
    expect(saved?.scheduleDispatchedAt).toBeInstanceOf(Date);
    expect(saved?.lastSentAt).toBeInstanceOf(Date);
    expect(saved?.recipientsCount).toBe(1);
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
  });

  it('never sends the same campaign twice, however often the tick runs', async () => {
    const campaign = await seedDueCampaign(new Date(Date.now() - 60_000));

    await dispatchScheduledCampaigns();
    await expect(dispatchScheduledCampaigns()).resolves.toBe(0);

    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
    await expect(
      CampaignSendModel.countDocuments({ campaignId: campaign._id.toHexString() }),
    ).resolves.toBe(1);
  });

  it('leaves a campaign scheduled for later alone', async () => {
    await seedDueCampaign(new Date(Date.now() + 3_600_000));

    await expect(dispatchScheduledCampaigns()).resolves.toBe(0);
    expect(sendMarketingEmail).not.toHaveBeenCalled();
  });

  it('keeps the claim when a send fails, so a broken campaign cannot loop', async () => {
    const campaign = await CampaignModel.create({
      name: 'Broken',
      channel: 'EMAIL',
      budget: 0,
      budgetCurrency: 'INR',
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
