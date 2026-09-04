import { marketingCustomResolvers } from '../../src/modules/marketing/marketing.resolvers';
import { CampaignModel } from '../../src/modules/marketing/marketing.model';
import { AudienceListModel } from '../../src/modules/marketing/audience.model';
import { CampaignSendModel } from '../../src/modules/marketing/campaign-send.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
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
    budget: 10000,
    startDate: new Date('2027-03-01'),
    endDate: new Date('2027-03-31'),
    status: 'ACTIVE',
    subject: 'Spring news',
    body: 'Hello!',
  });

const seedClient = (name: string, email: string) =>
  ClientModel.create({ name, email, phone: '000', company: 'Acme', status: 'ACTIVE' });

const send = (id: string, audienceListId: string) =>
  marketingCustomResolvers.Mutation.sendCampaign(null, { id, audienceListId }, asMarketing);

describe('Sending a campaign to an audience', () => {
  beforeAll(async () => {
    await AudienceListModel.init();
  });

  it('emails every client in the list and logs each one', async () => {
    const campaign = await seedCampaign();
    const [a, b] = await Promise.all([
      seedClient('Ada', 'ada@example.com'),
      seedClient('Bo', 'bo@example.com'),
    ]);
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      clientIds: [String(a._id), String(b._id)],
    });
    sendCustomEmail.mockResolvedValue(undefined);

    const result = (await send(String(campaign._id), String(audience._id))) as {
      sent: number;
      failed: number;
    };

    expect(result).toMatchObject({ sent: 2, failed: 0 });
    const log = await CampaignSendModel.find({ campaignId: String(campaign._id) }).lean();
    expect(log.map((row) => row.to).sort((x, y) => x.localeCompare(y))).toEqual([
      'ada@example.com',
      'bo@example.com',
    ]);
  });

  it('keeps a failed recipient, with the reason, instead of only counting it', async () => {
    const campaign = await seedCampaign();
    const client = await seedClient('Ada', 'ada@example.com');
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      clientIds: [String(client._id)],
    });
    sendCustomEmail.mockRejectedValue(new Error('550 mailbox unavailable'));

    const result = (await send(String(campaign._id), String(audience._id))) as { failed: number };

    expect(result.failed).toBe(1);
    const [row] = await CampaignSendModel.find({ campaignId: String(campaign._id) }).lean();
    expect(row.status).toBe('FAILED');
    expect(row.error).toContain('550');
  });

  it('counts only the delivered copies as recipients reached', async () => {
    const campaign = await seedCampaign();
    const [a, b] = await Promise.all([
      seedClient('Ada', 'ada@example.com'),
      seedClient('Bo', 'bo@example.com'),
    ]);
    const audience = await AudienceListModel.create({
      name: 'Newsletter',
      clientIds: [String(a._id), String(b._id)],
    });
    sendCustomEmail.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('nope'));

    await send(String(campaign._id), String(audience._id));

    const saved = await CampaignModel.findById(campaign._id).lean();
    expect(saved?.recipientsCount).toBe(1);
    expect(saved?.lastSentAt).toBeInstanceOf(Date);
  });

  it('refuses an empty audience rather than reporting a send of nobody', async () => {
    const campaign = await seedCampaign();
    const audience = await AudienceListModel.create({ name: 'Empty', clientIds: [] });

    await expect(send(String(campaign._id), String(audience._id))).rejects.toThrow(
      /has no clients in it/,
    );
    expect(sendCustomEmail).not.toHaveBeenCalled();
  });

  it('refuses to send a campaign that has no email content', async () => {
    const campaign = await CampaignModel.create({
      name: 'Draft',
      channel: 'EMAIL',
      budget: 0,
      startDate: new Date('2027-03-01'),
      endDate: new Date('2027-03-31'),
      status: 'PLANNED',
    });
    const audience = await AudienceListModel.create({ name: 'Newsletter', clientIds: ['x'] });

    await expect(send(String(campaign._id), String(audience._id))).rejects.toThrow(
      /subject and body/,
    );
  });

  it('reports the delivery log newest first', async () => {
    const campaign = await seedCampaign();
    await CampaignSendModel.create([
      {
        campaignId: String(campaign._id),
        audienceListId: 'a1',
        to: 'old@example.com',
        status: 'SENT',
        sentAt: new Date('2027-01-01'),
      },
      {
        campaignId: String(campaign._id),
        audienceListId: 'a1',
        to: 'new@example.com',
        status: 'SENT',
        sentAt: new Date('2027-02-01'),
      },
    ]);

    const rows = (await marketingCustomResolvers.Query.listCampaignSends(
      null,
      { campaignId: String(campaign._id) },
      asMarketing,
    )) as Array<{ to: string }>;

    expect(rows.map((row) => row.to)).toEqual(['new@example.com', 'old@example.com']);
  });
});
