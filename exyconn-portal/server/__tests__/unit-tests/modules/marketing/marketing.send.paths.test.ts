import { marketingCustomResolvers } from '../../../../src/modules/marketing/marketing.resolvers';
import { loadAudience, renderForMember } from '../../../../src/modules/marketing/marketing.send';
import * as tracking from '../../../../src/modules/marketing/marketing.tracking';
import { AudienceListModel } from '../../../../src/modules/marketing/audience.model';
import { CampaignSendModel } from '../../../../src/modules/marketing/campaign-send.model';
import { emailer } from '../../../../src/modules/email';
import { RawHtml } from '../../../../src/modules/email/email.render';
import { mailer } from '../../../../src/utils/mailer';
import { logger } from '../../../../src/utils/logger';
import { Types } from 'mongoose';
import { asMarketing, seedCampaign, seedClient } from './marketing.fixtures';

jest.mock('../../../../src/utils/mailer', () => ({
  mailer: { sendCustomEmail: jest.fn() },
}));

const sendCustomEmail = mailer.sendCustomEmail as jest.Mock;

const send = (id: string, args: { audienceListId?: string; testEmail?: string }) =>
  marketingCustomResolvers.Mutation.sendCampaign(null, { id, ...args }, asMarketing) as Promise<{
    sent: number;
    failed: number;
    skipped: number;
    campaign: { id: string };
  }>;

async function audienceOf(email: string) {
  const client = await seedClient('Ada', email);
  const audience = await AudienceListModel.create({
    name: 'Newsletter',
    clientIds: [String(client._id)],
  });
  return String(audience._id);
}

beforeEach(() => {
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  sendCustomEmail.mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('renderForMember', () => {
  const member = { email: 'ada@example.com', name: 'Ada', company: 'Acme' };

  it('merges the copy and adds the footer, untracked when no tracking is asked for', () => {
    const rendered = renderForMember(
      { subject: 'Hi {{name}}', body: '<a href="https://example.com">Go</a>' },
      member,
      'https://portal.example/unsubscribe?t=abc',
    );

    expect(rendered.subject).toBe('Hi Ada');
    expect(rendered.body).not.toContain('/m/c/');
    expect(rendered.body).toContain('Unsubscribe: https://portal.example/unsubscribe?t=abc');
    expect(rendered.vars).toEqual({ ...member, unsubscribeUrl: expect.any(String) });
  });

  it('tracks every link except the unsubscribe one when tracking is on', () => {
    const unsubscribeUrl = 'https://portal.example/unsubscribe?t=abc';

    const rendered = renderForMember(
      {
        subject: 'Hi',
        body: `<a href="https://example.com">Go</a><a href="${unsubscribeUrl}">Out</a>`,
      },
      member,
      unsubscribeUrl,
      { origin: 'https://portal.example', token: 'tok' },
    );

    expect(rendered.body).toContain('https://portal.example/m/c/tok?u=');
    expect(rendered.body).toContain(`href="${unsubscribeUrl}"`);
    expect(rendered.body).toContain('/m/o/tok.gif');
  });
});

describe('sending through a stored template', () => {
  it('hands the merged copy to the template, as raw HTML, naming the campaign', async () => {
    const templateSend = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
    const campaign = await seedCampaign({ templateKey: 'newsletter' });

    const result = await send(String(campaign._id), {
      audienceListId: await audienceOf('ada@x.com'),
    });

    expect(result).toMatchObject({ sent: 1, failed: 0, skipped: 0 });
    expect(result.campaign.id).toBe(String(campaign._id));
    expect(sendCustomEmail).not.toHaveBeenCalled();
    const [input] = templateSend.mock.calls[0];
    expect(input).toMatchObject({
      template: 'newsletter',
      to: 'ada@x.com',
      triggeredBy: `campaign:${String(campaign._id)}`,
      variables: expect.objectContaining({ name: 'Ada', subject: 'Hello Ada' }),
    });
    expect(input.variables.body).toBeInstanceOf(RawHtml);
  });
});

describe('when a copy does not go out', () => {
  it('records a transport failure that is not an Error as a plain failed send', async () => {
    sendCustomEmail.mockRejectedValue('connection reset');
    const campaign = await seedCampaign();

    const result = await send(String(campaign._id), {
      audienceListId: await audienceOf('ada@x.com'),
    });

    expect(result.failed).toBe(1);
    const [row] = await CampaignSendModel.find({ campaignId: String(campaign._id) }).lean();
    expect(row).toMatchObject({ status: 'FAILED', error: 'Send failed' });
    expect(row.trackingTokenHash).toHaveLength(64);
  });

  it('logs a copy that never completed as skipped rather than losing it', async () => {
    jest.spyOn(tracking, 'newTrackingToken').mockImplementationOnce(() => {
      throw new Error('no entropy');
    });
    const campaign = await seedCampaign();

    const result = await send(String(campaign._id), {
      audienceListId: await audienceOf('ada@x.com'),
    });

    expect(result).toMatchObject({ sent: 0, failed: 0, skipped: 1 });
    const [row] = await CampaignSendModel.find({ campaignId: String(campaign._id) }).lean();
    expect(row).toMatchObject({ to: 'ada@x.com', status: 'SKIPPED' });
    expect(row.error).toBe('The send never completed');
    expect(sendCustomEmail).not.toHaveBeenCalled();
  });

  it('sends a test copy to the address as typed, trimmed and lower-cased', async () => {
    const campaign = await seedCampaign();

    await send(String(campaign._id), { testEmail: '  Me@Exyconn.com ' });

    expect(sendCustomEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'me@exyconn.com', name: 'me@exyconn.com' }),
    );
  });
});

describe('refusals', () => {
  it('refuses a campaign that does not exist', async () => {
    await expect(send(String(new Types.ObjectId()), { testEmail: 'a@x.com' })).rejects.toThrow(
      'Campaign not found',
    );
  });

  it('refuses a send to an audience that does not exist', async () => {
    await expect(loadAudience(String(new Types.ObjectId()))).rejects.toThrow(
      'Audience list not found',
    );
  });

  it('refuses a campaign with a subject but no body', async () => {
    const campaign = await seedCampaign({ body: '' });

    await expect(send(String(campaign._id), { testEmail: 'a@x.com' })).rejects.toThrow(
      /subject and body/,
    );
  });
});
