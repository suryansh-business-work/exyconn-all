import {
  dispatchScheduledCampaigns,
  startCampaignSchedule,
} from '../../../../src/modules/marketing/marketing.schedule';
import { CampaignModel } from '../../../../src/modules/marketing/marketing.model';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { runForOrganization } from '../../../../src/lib/tenant';
import { logger } from '../../../../src/utils/logger';
import { seedOrganization } from '../../../helpers';
import { eventually, seedCampaign } from './marketing.fixtures';

/** A campaign whose moment has passed, aimed at an audience that does not exist. */
const seedBrokenDue = (name: string) =>
  seedCampaign({
    name,
    scheduledAt: new Date(Date.now() - 60_000),
    scheduledAudienceListId: 'missing-audience',
  });

const lastRun = async () => readJobRuns().get(JOB_KEYS.campaignSchedule);

let logError: jest.SpyInstance;

beforeEach(() => {
  logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  clearJobRuns();
});

afterEach(() => jest.restoreAllMocks());

describe('the per-tick limit', () => {
  it('sends at most five due campaigns in one tick and leaves the rest for the next', async () => {
    for (const name of ['A', 'B', 'C', 'D', 'E', 'F']) {
      await seedBrokenDue(name);
    }

    await expect(dispatchScheduledCampaigns()).resolves.toBe(5);
    await expect(CampaignModel.countDocuments({ scheduleDispatchedAt: null })).resolves.toBe(1);
    await expect(dispatchScheduledCampaigns()).resolves.toBe(1);
  });

  it('logs a failed scheduled send by name and moves on', async () => {
    await seedBrokenDue('Broken');

    await dispatchScheduledCampaigns();

    expect(logError).toHaveBeenCalledWith(expect.anything(), 'Scheduled campaign "Broken" failed');
  });

  it('ignores a campaign with a moment but nowhere to send it', async () => {
    await seedCampaign({ scheduledAt: new Date(Date.now() - 60_000), scheduledAudienceListId: '' });

    await expect(dispatchScheduledCampaigns()).resolves.toBe(0);
  });
});

describe('the registered background job', () => {
  it('runs one pass of the dispatcher on demand', async () => {
    await seedBrokenDue('On demand');
    const job = findBackgroundJob(JOB_KEYS.campaignSchedule);

    expect(job?.label).toBe('Scheduled campaigns');
    await expect(job?.runOnce()).resolves.toBe(1);
  });
});

function fakeInterval() {
  const unref = jest.fn();
  const setIntervalSpy = jest
    .spyOn(globalThis, 'setInterval')
    .mockReturnValue({ unref } as unknown as ReturnType<typeof setInterval>);
  return { unref, setIntervalSpy };
}

describe('startCampaignSchedule', () => {
  it('checks every company at once, then every minute, and reports what it sent', async () => {
    const { unref, setIntervalSpy } = fakeInterval();
    const organization = await seedOrganization('Schedule Co');
    await runForOrganization(organization._id.toHexString(), () => seedBrokenDue('Org campaign'));

    startCampaignSchedule();

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000);
    expect(unref).toHaveBeenCalled();
    const run = await eventually(lastRun, (value) => value !== undefined);
    expect(run?.summary).toBe('1 campaign(s) sent');
  });

  it('runs the same check again on each interval tick', async () => {
    const { setIntervalSpy } = fakeInterval();
    startCampaignSchedule();
    await eventually(lastRun, (value) => value !== undefined);
    clearJobRuns();

    const tick = setIntervalSpy.mock.calls[0][0] as () => void;
    tick();

    const run = await eventually(lastRun, (value) => value !== undefined);
    expect(run?.summary).toBe('0 campaign(s) sent');
  });

  it('logs a check that could not list the companies instead of throwing', async () => {
    fakeInterval();
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('db down');
    });

    startCampaignSchedule();

    await eventually(
      async () => logError.mock.calls.length,
      (count) => count > 0,
    );
    expect(logError).toHaveBeenCalledWith(expect.any(Error), 'Scheduled campaign check failed');
    expect(readJobRuns().has(JOB_KEYS.campaignSchedule)).toBe(false);
  });
});
