import { startSocialSchedule } from '../../../../src/modules/social-accounts/social.scheduler';
import { publishDuePosts } from '../../../../src/modules/social-accounts/social.publish';
import { syncAllAccounts } from '../../../../src/modules/social-accounts/social.sync';
import { forEachOrganization } from '../../../../src/modules/organizations';
import { logger } from '../../../../src/utils/logger';
import { asArg } from '../../../mockAs';

jest.mock('../../../../src/modules/organizations', () => ({ forEachOrganization: jest.fn() }));
jest.mock('../../../../src/modules/social-accounts/social.publish', () => ({
  publishDuePosts: jest.fn(),
}));
jest.mock('../../../../src/modules/social-accounts/social.sync', () => ({
  syncAllAccounts: jest.fn(),
}));

const forEach = forEachOrganization as jest.Mock;
const settle = () => new Promise((resolve) => setImmediate(resolve));

interface Tick {
  run: () => void;
  ms: number;
  unref: jest.Mock;
}

/** Starts the schedule with the intervals captured instead of armed. */
function start(): Tick[] {
  const ticks: Tick[] = [];
  const armed = jest.spyOn(globalThis, 'setInterval').mockImplementation(
    asArg((run: () => void, ms: number) => {
      const unref = jest.fn();
      ticks.push({ run, ms, unref });
      return { unref };
    }),
  );
  try {
    startSocialSchedule();
  } finally {
    armed.mockRestore();
  }
  return ticks;
}

afterEach(() => jest.restoreAllMocks());

describe('the social schedule', () => {
  it('publishes due posts at once, then every minute, and syncs every six hours', async () => {
    forEach.mockResolvedValue(undefined);
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);

    const ticks = start();

    expect(forEach).toHaveBeenCalledTimes(1);
    expect(forEach).toHaveBeenCalledWith(publishDuePosts, 'Scheduled social posts');
    expect(ticks.map((tick) => tick.ms)).toEqual([60_000, 6 * 60 * 60 * 1000]);
    expect(ticks.every((tick) => tick.unref.mock.calls.length === 1)).toBe(true);
    expect(info).toHaveBeenCalledWith('Social schedule started');

    ticks[1].run();
    expect(forEach).toHaveBeenLastCalledWith(syncAllAccounts, 'Social account sync');
    ticks[0].run();
    expect(forEach).toHaveBeenLastCalledWith(publishDuePosts, 'Scheduled social posts');
    await settle();
  });

  it('logs a failed round instead of letting it escape', async () => {
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const publishFailure = new Error('database unavailable');
    const syncFailure = new Error('sync unavailable');
    forEach.mockRejectedValueOnce(publishFailure).mockRejectedValueOnce(syncFailure);

    const ticks = start();
    ticks[1].run();
    await settle();

    expect(logged).toHaveBeenCalledWith(publishFailure, 'Scheduled social post check failed');
    expect(logged).toHaveBeenCalledWith(syncFailure, 'Social account sync failed');
  });
});
