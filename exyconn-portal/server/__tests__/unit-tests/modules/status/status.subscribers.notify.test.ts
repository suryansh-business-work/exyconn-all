import { createHash } from 'node:crypto';
import { StatusSubscriberModel } from '../../../../src/modules/status/status-subscriber.model';
import {
  notifyStatusSubscribers,
  statusSiteOrigin,
  unsubscribeFromStatus,
} from '../../../../src/modules/status/status.subscribers';
import { emailer } from '../../../../src/modules/email';
import { logger } from '../../../../src/utils/logger';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));

const sendTemplate = emailer.send as jest.Mock;

const notice = {
  headline: 'Portal API is down',
  detail: 'HTTP 503',
  serviceName: 'Portal API',
  url: 'https://api.example.test',
};

type SentNotice = { to: string; template: string; variables: Record<string, string> };
const sent = (): SentNotice[] => sendTemplate.mock.calls.map((call) => call[0] as SentNotice);

/** `count` confirmed subscribers plus one who never followed the confirm link. */
async function seedSubscribers(count: number) {
  const confirmed = Array.from({ length: count }, (_, index) => ({
    email: `reader${index}@example.com`,
    confirmedAt: new Date(),
  }));
  await StatusSubscriberModel.insertMany([...confirmed, { email: 'pending@example.com' }]);
}

afterEach(() => jest.restoreAllMocks());

describe('notifyStatusSubscribers', () => {
  it('sends nothing when nobody has confirmed', async () => {
    await StatusSubscriberModel.create({ email: 'pending@example.com' });

    await expect(notifyStatusSubscribers(notice)).resolves.toBe(0);
    expect(sendTemplate).not.toHaveBeenCalled();
  });

  it('reaches every confirmed subscriber across several batches, and nobody else', async () => {
    await seedSubscribers(30);

    await expect(notifyStatusSubscribers(notice)).resolves.toBe(30);

    const recipients = sent().map((entry) => entry.to);
    expect(recipients).toHaveLength(30);
    expect(new Set(recipients).size).toBe(30);
    expect(recipients).not.toContain('pending@example.com');
    expect(sent()[0]).toMatchObject({
      template: 'status-incident-notice',
      variables: { ...notice, statusUrl: statusSiteOrigin() },
    });
  });

  it('gives each email an unsubscribe link that removes exactly that reader', async () => {
    await seedSubscribers(2);
    await notifyStatusSubscribers(notice);
    const [first] = sent();
    const token = new URL(first.variables.unsubscribeUrl).searchParams.get('token') ?? '';

    const stored = await StatusSubscriberModel.findOne({ email: first.to }).lean();
    expect(stored?.unsubscribeTokenHash).toBe(createHash('sha256').update(token).digest('hex'));

    await expect(unsubscribeFromStatus(token)).resolves.toBe(true);
    expect(await StatusSubscriberModel.countDocuments({ email: first.to })).toBe(0);
    expect(await StatusSubscriberModel.countDocuments()).toBe(2);
  });

  it('counts only the notices that went out when some bounce', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation((() => undefined) as never);
    jest.spyOn(logger, 'info').mockImplementation((() => undefined) as never);
    await seedSubscribers(3);
    sendTemplate.mockRejectedValueOnce(new Error('mailbox full'));

    await expect(notifyStatusSubscribers(notice)).resolves.toBe(2);

    expect(sendTemplate).toHaveBeenCalledTimes(3);
    expect(error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Status notice to a subscriber failed',
    );
  });
});

describe('unsubscribeFromStatus', () => {
  it('answers true for a link that matches nobody', async () => {
    await StatusSubscriberModel.create({ email: 'reader@example.com', confirmedAt: new Date() });

    await expect(unsubscribeFromStatus('unknown-token')).resolves.toBe(true);
    expect(await StatusSubscriberModel.countDocuments()).toBe(1);
  });
});
