import { trackerAdminService } from '../../../../src/modules/tracker/tracker.admin.service';
import {
  TrackerIntervalModel,
  TrackerSessionModel,
  TrackerWindowUsageModel,
} from '../../../../src/modules/tracker/models';

const DAY_START = new Date('2026-07-13T00:00:00.000Z');
const DAY_END = new Date('2026-07-14T00:00:00.000Z');
const NINE = new Date('2026-07-13T09:00:00.000Z');
const NINE_TEN = new Date('2026-07-13T09:10:00.000Z');

function usage(userId: string, appName: string, durationMs: number, intervalStartedAt = NINE) {
  return TrackerWindowUsageModel.create({
    userId,
    sessionId: 's1',
    intervalStartedAt,
    appName,
    windowTitle: `${appName} window`,
    durationMs,
  });
}

describe('one employee’s day', () => {
  it('lists the day’s runs and apps, busiest app first, with no screenshots', async () => {
    await TrackerSessionModel.create({
      userId: 'u1',
      deviceId: 'd1',
      startedAt: NINE,
      status: 'stopped',
    });
    await TrackerIntervalModel.create({
      userId: 'u1',
      sessionId: 's1',
      startedAt: NINE,
      endedAt: NINE_TEN,
      activeMs: 500_000,
    });
    await usage('u1', 'Mail', 120_000);
    await usage('u1', 'Code', 300_000);
    await usage('u1', 'Code', 100_000, NINE_TEN);
    // Another employee's apps, and this employee's apps on another day, stay out.
    await usage('u2', 'Slack', 900_000);
    await usage('u1', 'Games', 900_000, new Date('2026-07-14T09:00:00.000Z'));

    const day = await trackerAdminService.day('u1', DAY_START, DAY_END);

    expect(day.sessions).toHaveLength(1);
    expect(day.intervals).toHaveLength(1);
    expect(day.screenshots).toEqual([]);
    expect(day.appUsage).toEqual([
      { appName: 'Code', durationMs: 400_000 },
      { appName: 'Mail', durationMs: 120_000 },
    ]);
  });
});
