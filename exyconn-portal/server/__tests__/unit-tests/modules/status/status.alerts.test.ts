import { randomBytes } from 'node:crypto';
import {
  announceIncident,
  announceMaintenance,
} from '../../../../src/modules/status/status.alerts';
import { notifyStatusSubscribers } from '../../../../src/modules/status/status.subscribers';
import { TrackerBuildSettingsModel } from '../../../../src/modules/tech/tracker-build-settings.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';
import { slackNotifier } from '../../../../src/utils/slack';
import { mailer } from '../../../../src/utils/mailer';
import { logger } from '../../../../src/utils/logger';
import { seedUser } from '../../../helpers';

jest.mock('../../../../src/utils/slack', () => ({
  slackNotifier: { sendMessage: jest.fn() },
}));
jest.mock('../../../../src/utils/mailer', () => ({
  mailer: { sendCustomEmail: jest.fn() },
}));
jest.mock('../../../../src/modules/status/status.subscribers', () => ({
  notifyStatusSubscribers: jest.fn(),
}));

const sendSlack = slackNotifier.sendMessage as jest.Mock;
const sendEmail = mailer.sendCustomEmail as jest.Mock;
const notify = notifyStatusSubscribers as jest.Mock;

const website = { key: 'website', name: 'Website', url: 'https://example.test' };
const password = () => randomBytes(16).toString('hex');

afterEach(() => jest.restoreAllMocks());

describe('announceIncident', () => {
  beforeEach(async () => {
    await TrackerBuildSettingsModel.create({ key: 'default', statusAlertChannels: ['C1'] });
    await seedUser('ops@exyconn.com', password(), [ROLES.TECH]);
  });

  it('says "no response" everywhere when an outage carries no reason', async () => {
    await announceIncident('OPENED', website, '');

    expect(sendSlack).toHaveBeenCalledWith(
      ':red_circle: *Website is down* — https://example.test\nReason: no response',
      'C1',
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ops@exyconn.com',
        subject: '[Status] Website is down',
        message: expect.stringContaining('Reason: no response'),
      }),
    );
    expect(notify).toHaveBeenCalledWith({
      headline: 'Website is down',
      detail: 'No response from the service.',
      serviceName: 'Website',
      url: 'https://example.test',
    });
  });

  it('passes the probe reason on when there is one', async () => {
    await announceIncident('OPENED', website, 'HTTP 502');

    expect(sendSlack.mock.calls[0][0]).toContain('Reason: HTTP 502');
    expect(sendEmail.mock.calls[0][0].message).toContain('Reason: HTTP 502');
    expect(notify.mock.calls[0][0].detail).toBe('HTTP 502');
  });

  it('words a recovery as back up on every channel', async () => {
    await announceIncident('RESOLVED', website, '');

    expect(sendSlack).toHaveBeenCalledWith(
      ':large_green_circle: *Website is back up* — https://example.test\nIncident resolved.',
      'C1',
    );
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      subject: '[Status] Website is back up',
      message: expect.stringContaining('the incident has been resolved'),
    });
    expect(notify.mock.calls[0][0]).toMatchObject({
      headline: 'Website is back up',
      detail: 'The service is answering again.',
    });
  });

  it('emails only active Tech members', async () => {
    const leaver = await seedUser('gone@exyconn.com', password(), [ROLES.TECH]);
    await UserModel.updateOne({ _id: leaver._id }, { isActive: false });

    await announceIncident('OPENED', website, 'HTTP 500');

    expect(sendEmail.mock.calls.map((call) => call[0].email)).toEqual(['ops@exyconn.com']);
  });

  it('logs a failed channel without stopping the others', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation((() => undefined) as never);
    const bounce = new Error('mailbox full');
    notify.mockRejectedValueOnce(bounce);

    await expect(announceIncident('OPENED', website, 'HTTP 500')).resolves.toBeUndefined();

    expect(sendSlack).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith({ err: bounce }, 'Status alert for website (OPENED) failed');
  });
});

describe('announceIncident without alert channels', () => {
  it('skips Slack when no settings were ever saved', async () => {
    await announceIncident('OPENED', website, 'HTTP 500');

    expect(sendSlack).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledTimes(1);
  });
});

describe('announceMaintenance', () => {
  const window = {
    title: 'Database upgrade',
    body: 'The API will be read-only.',
    startsAt: new Date('2026-11-01T02:00:00.000Z'),
    endsAt: new Date('2026-11-01T03:00:00.000Z'),
  };

  it('tells subscribers what is planned and when', async () => {
    await announceMaintenance(window);

    expect(notify).toHaveBeenCalledWith({
      headline: 'Planned maintenance: Database upgrade',
      detail:
        'The API will be read-only.\n\nScheduled for 2026-11-01T02:00:00.000Z — 2026-11-01T03:00:00.000Z.',
      serviceName: 'Database upgrade',
      url: '',
    });
  });

  it('logs a failed notice instead of failing the saved plan', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation((() => undefined) as never);
    const outage = new Error('SMTP down');
    notify.mockRejectedValueOnce(outage);

    await expect(announceMaintenance(window)).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(
      { err: outage },
      'Maintenance notice for "Database upgrade" failed',
    );
  });
});
