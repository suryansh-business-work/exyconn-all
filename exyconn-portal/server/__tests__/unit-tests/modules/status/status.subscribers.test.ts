import { StatusSubscriberModel } from '../../../../src/modules/status/status-subscriber.model';
import {
  confirmStatusSubscription,
  statusSiteOrigin,
  subscribeIpLimiter,
  subscribeLimiter,
  subscribeToStatus,
} from '../../../../src/modules/status/status.subscribers';
import { emailer } from '../../../../src/modules/email';
import { logger } from '../../../../src/utils/logger';
import { env } from '../../../../src/config/env';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));

const sendTemplate = emailer.send as jest.Mock;
const platformSite = `https://status.${env.status.domain}`;

const lastVariables = () =>
  (sendTemplate.mock.calls.at(-1)?.[0] as { variables: Record<string, string> }).variables;
const tokenOf = (link: string) => new URL(link).searchParams.get('token') ?? '';

beforeEach(async () => {
  await Promise.all([subscribeLimiter.reset(), subscribeIpLimiter.reset()]);
  await StatusSubscriberModel.init();
});
afterEach(() => jest.restoreAllMocks());

describe('statusSiteOrigin', () => {
  it('honours an origin CORS already trusts', () => {
    const trusted = env.corsOrigins[0];
    expect(statusSiteOrigin(trusted)).toBe(trusted);
  });

  it('sends anything else to the platform status host', () => {
    expect(statusSiteOrigin('https://evil.example')).toBe(platformSite);
    expect(statusSiteOrigin()).toBe(platformSite);
    expect(statusSiteOrigin('')).toBe(platformSite);
  });
});

describe('subscribeToStatus', () => {
  it('answers true for a malformed address without storing or sending anything', async () => {
    await expect(subscribeToStatus('not-an-email')).resolves.toBeUndefined();
    await expect(subscribeToStatus(`${'a'.repeat(250)}@example.com`)).resolves.toBeUndefined();

    expect(await StatusSubscriberModel.countDocuments()).toBe(0);
    expect(sendTemplate).not.toHaveBeenCalled();
  });

  it('builds the emailed links on the trusted origin the request came from', async () => {
    const trusted = env.corsOrigins[0];

    await subscribeToStatus('asha@example.com', trusted);

    expect(lastVariables().confirmUrl.startsWith(`${trusted}/subscribe/confirm?token=`)).toBe(true);
    expect(lastVariables().unsubscribeUrl.startsWith(`${trusted}/unsubscribe?token=`)).toBe(true);
  });

  it('stops one machine from mailing links to a list of strangers', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    for (let index = 0; index < 11; index += 1) {
      await expect(
        subscribeToStatus(`person${index}@example.com`, undefined, '198.51.100.7'),
      ).resolves.toBeUndefined();
    }

    expect(sendTemplate).toHaveBeenCalledTimes(10);
    expect(await StatusSubscriberModel.countDocuments()).toBe(10);
    expect(warn).toHaveBeenCalledWith('Status subscription from 198.51.100.7 rate-limited');
  });

  it('keeps the subscription when the confirmation email fails', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    sendTemplate.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(subscribeToStatus('asha@example.com')).resolves.toBeUndefined();

    expect(await StatusSubscriberModel.countDocuments({ email: 'asha@example.com' })).toBe(1);
    expect(error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Status confirmation email to asha@example.com failed',
    );
  });

  it('replaces the confirm link when an unconfirmed address asks again', async () => {
    await subscribeToStatus('asha@example.com');
    const firstToken = tokenOf(lastVariables().confirmUrl);
    await subscribeToStatus('asha@example.com');
    const secondToken = tokenOf(lastVariables().confirmUrl);

    await expect(confirmStatusSubscription(firstToken)).rejects.toThrow(/invalid/);
    await expect(confirmStatusSubscription(secondToken)).resolves.toBe(true);
    expect(await StatusSubscriberModel.countDocuments()).toBe(1);
  });
});

describe('confirmStatusSubscription', () => {
  it('refuses a token nobody was sent', async () => {
    await expect(confirmStatusSubscription('made-up')).rejects.toThrow(
      'This link is invalid or has already been used.',
    );
  });

  it('refuses a row whose token has already been spent', async () => {
    jest.spyOn(StatusSubscriberModel, 'findOne').mockResolvedValueOnce({ tokenHash: '' });

    await expect(confirmStatusSubscription('replayed')).rejects.toThrow(
      'This link is invalid or has already been used.',
    );
  });
});
