import { marketingCustomResolvers } from '../../src/modules/marketing/marketing.resolvers';
import { CampaignModel } from '../../src/modules/marketing/marketing.model';
import { AudienceListModel } from '../../src/modules/marketing/audience.model';
import { CampaignSendModel } from '../../src/modules/marketing/campaign-send.model';
import { MarketingSuppressionModel } from '../../src/modules/marketing/suppression.model';
import { MarketingUnsubscribeTokenModel } from '../../src/modules/marketing/unsubscribe-token.model';
import { unsubscribeLimiter } from '../../src/modules/marketing/marketing.suppression';
import { ContactModel } from '../../src/modules/crm/contact.model';
import { mailer } from '../../src/utils/mailer';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendCustomEmail: jest.fn() },
}));

const sendCustomEmail = mailer.sendCustomEmail as jest.Mock;

const asMarketing: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.MARKETING], email: 'growth@exyconn.com' },
};

const seedCampaign = () =>
  CampaignModel.create({
    name: 'Spring newsletter',
    channel: 'EMAIL',
    budget: 1000,
    startDate: new Date('2027-03-01'),
    endDate: new Date('2027-03-31'),
    status: 'ACTIVE',
    subject: 'Hello {{name}}',
    body: 'Dear {{name}} of {{company}} — offers inside.',
  });

const seedContact = (name: string, email: string, status = 'ACTIVE') =>
  ContactModel.create({ name, email, owner: 'growth@exyconn.com', companyName: 'Acme', status });

const send = (id: string, audienceListId: string) =>
  marketingCustomResolvers.Mutation.sendCampaign(
    null,
    { id, audienceListId },
    asMarketing,
  ) as Promise<{ sent: number; failed: number; skipped: number }>;

const logFor = (campaignId: string) => CampaignSendModel.find({ campaignId }).lean();

describe('Consent and suppression', () => {
  beforeEach(() => {
    unsubscribeLimiter.reset();
    sendCustomEmail.mockResolvedValue(undefined);
  });

  it('skips a suppressed address and says so in the delivery log', async () => {
    const campaign = await seedCampaign();
    const contact = await seedContact('Ada', 'ada@example.com');
    await MarketingSuppressionModel.create({ email: 'ada@example.com', reason: 'MANUAL' });
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      contactIds: [String(contact._id)],
    });

    const result = await send(String(campaign._id), String(audience._id));

    expect(result).toMatchObject({ sent: 0, skipped: 1 });
    expect(sendCustomEmail).not.toHaveBeenCalled();
    const [row] = await logFor(String(campaign._id));
    expect(row).toMatchObject({ status: 'SKIPPED', error: 'On the suppression list' });
  });

  it('skips an unsubscribed contact and adds them to the list the first time', async () => {
    const campaign = await seedCampaign();
    const contact = await seedContact('Bo', 'bo@example.com', 'UNSUBSCRIBED');
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      contactIds: [String(contact._id)],
    });

    await send(String(campaign._id), String(audience._id));

    const suppression = await MarketingSuppressionModel.findOne({ email: 'bo@example.com' }).lean();
    expect(suppression).toMatchObject({ reason: 'UNSUBSCRIBED' });
    expect(sendCustomEmail).not.toHaveBeenCalled();
  });

  it('skips a bounced contact for the reason the CRM already recorded', async () => {
    const campaign = await seedCampaign();
    const contact = await seedContact('Cy', 'cy@example.com', 'BOUNCED');
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      contactIds: [String(contact._id)],
    });

    await send(String(campaign._id), String(audience._id));

    const suppression = await MarketingSuppressionModel.findOne({ email: 'cy@example.com' }).lean();
    expect(suppression?.reason).toBe('BOUNCED');
  });

  it('still sends to everybody else in the same audience', async () => {
    const campaign = await seedCampaign();
    const [ok, blocked] = await Promise.all([
      seedContact('Ada', 'ada@example.com'),
      seedContact('Bo', 'bo@example.com', 'UNSUBSCRIBED'),
    ]);
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      contactIds: [String(ok._id), String(blocked._id)],
    });

    const result = await send(String(campaign._id), String(audience._id));

    expect(result).toMatchObject({ sent: 1, failed: 0, skipped: 1 });
    expect(sendCustomEmail).toHaveBeenCalledTimes(1);
  });

  it('merges each recipient’s own values into the subject and body', async () => {
    const campaign = await seedCampaign();
    const contact = await seedContact('Ada', 'ada@example.com');
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      contactIds: [String(contact._id)],
    });

    await send(String(campaign._id), String(audience._id));

    const [payload] = sendCustomEmail.mock.calls[0] as [{ subject: string; message: string }];
    expect(payload.subject).toBe('Hello Ada');
    expect(payload.message).toContain('Dear Ada of Acme');
    expect(payload.message).toContain('/unsubscribe?t=');
  });
});

describe('Unsubscribing from a link', () => {
  const unsubscribe = (token: string) =>
    marketingCustomResolvers.Mutation.unsubscribeFromMarketing(
      null,
      { token },
      {
        user: null,
        ip: '203.0.113.9',
      },
    );

  beforeEach(() => {
    unsubscribeLimiter.reset();
    sendCustomEmail.mockResolvedValue(undefined);
  });

  async function sentCampaignToken(): Promise<string> {
    const campaign = await seedCampaign();
    const contact = await seedContact('Ada', 'ada@example.com');
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      contactIds: [String(contact._id)],
    });
    await send(String(campaign._id), String(audience._id));
    const [payload] = sendCustomEmail.mock.calls[0] as [{ message: string }];
    return /unsubscribe\?t=(\w+)/.exec(payload.message)?.[1] ?? '';
  }

  it('suppresses the address and marks the CRM contact unsubscribed', async () => {
    const token = await sentCampaignToken();

    await expect(unsubscribe(token)).resolves.toBe(true);

    const suppression = await MarketingSuppressionModel.findOne({
      email: 'ada@example.com',
    }).lean();
    expect(suppression?.reason).toBe('UNSUBSCRIBED');
    const contact = await ContactModel.findOne({ email: 'ada@example.com' }).lean();
    expect(contact?.status).toBe('UNSUBSCRIBED');
  });

  it('is idempotent, because a link gets clicked and prefetched more than once', async () => {
    const token = await sentCampaignToken();

    await unsubscribe(token);
    await expect(unsubscribe(token)).resolves.toBe(true);

    await expect(
      MarketingSuppressionModel.countDocuments({ email: 'ada@example.com' }),
    ).resolves.toBe(1);
  });

  it('refuses a token that was never issued', async () => {
    await expect(unsubscribe('not-a-real-token')).rejects.toThrow(/not valid/);
  });

  it('stores only the hash, so the collection cannot be turned into working links', async () => {
    const token = await sentCampaignToken();

    const row = await MarketingUnsubscribeTokenModel.findOne({ email: 'ada@example.com' }).lean();

    expect(row?.tokenHash).not.toBe(token);
    expect(row?.tokenHash).toHaveLength(64);
  });
});
