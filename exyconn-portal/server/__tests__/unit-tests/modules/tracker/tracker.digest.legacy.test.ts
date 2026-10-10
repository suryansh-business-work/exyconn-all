import { randomUUID } from 'node:crypto';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { emailer } from '../../../../src/modules/email/email.service';
import { ROLES } from '../../../../src/constants/roles';
import { TrackerSettingsModel } from '../../../../src/modules/tracker/models';
import { updateTrackerSettings } from '../../../../src/modules/tracker/tracker.settings.service';
import { runDueDigests } from '../../../../src/modules/tracker/tracker.digest';
import { freezeClock } from '../../../helpers';

/** 2026-09-07 is a Monday, so both the daily and the weekly summary are due. */
const MONDAY_10AM = '2026-09-07T10:00:00.000Z';

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('digests for a settings row stored before the last-run stamps existed', () => {
  it('treats the missing stamps as "never sent" and sends both summaries', async () => {
    freezeClock(MONDAY_10AM);
    const send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
    await UserModel.create({
      name: 'Manager',
      email: `manager-${randomUUID()}@exyconn.com`,
      passwordHash: randomUUID(),
      roles: [ROLES.TRACKER],
    });
    await updateTrackerSettings({
      dailyDigestEnabled: true,
      weeklyDigestEnabled: true,
      digestHour: 9,
    });
    await TrackerSettingsModel.updateOne(
      { key: 'global' },
      { $unset: { dailyDigestLastRun: 1, weeklyDigestLastRun: 1 } },
    );

    await runDueDigests();

    expect(send).toHaveBeenCalledTimes(2);
    await expect(TrackerSettingsModel.findOne({ key: 'global' }).lean()).resolves.toMatchObject({
      dailyDigestLastRun: '2026-09-07',
      weeklyDigestLastRun: '2026-09-07',
    });
  });
});
