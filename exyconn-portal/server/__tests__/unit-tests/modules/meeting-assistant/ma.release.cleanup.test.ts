import { Types } from 'mongoose';
import { useTestOrganization } from '../../../helpers';
import {
  maReleaseMutations,
  maReleaseQueries,
} from '../../../../src/modules/meeting-assistant/ma.release.resolvers';
import {
  applyReleaseRetention,
  deleteRelease,
  releasesBeyondRetention,
  startReleaseRetention,
} from '../../../../src/modules/meeting-assistant/releases.cleanup';
import { registerRelease } from '../../../../src/modules/meeting-assistant/releases.service';
import { deleteReleaseZip } from '../../../../src/modules/meeting-assistant/releases.store';
import {
  MaReleaseModel,
  MaReleaseSettingsModel,
} from '../../../../src/modules/meeting-assistant/models';
import type { LeanRelease } from '../../../../src/modules/meeting-assistant/releases.service';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { AuditLogModel } from '../../../../src/modules/audit';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { slackNotifier } from '../../../../src/utils/slack';
import { JOB_KEYS, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { ctxOf, seedAccount } from './ma.fixtures';

jest.mock('../../../../src/modules/meeting-assistant/releases.store', () => ({
  deleteReleaseZip: jest.fn(),
}));

const organizationId = useTestOrganization();
let asManager: GraphQLContext;
let asEmployee: GraphQLContext;

/** A build as CI uploads it, built `day` days into October, then moved to `status`. */
async function seedRelease(
  version: string,
  day: number,
  status = 'QA_PENDING',
  channel = 'STABLE',
) {
  const created = await registerRelease(
    {
      version,
      channel: channel as 'STABLE',
      buildNumber: day,
      commitSha: 'abcdef1',
      builtAt: new Date(Date.UTC(2026, 9, day)),
      artifactName: `meet-${version}.zip`,
      artifactSize: 10,
      sha256: 'a'.repeat(64),
      fileId: new Types.ObjectId(),
      buildRunUrl: '',
      releaseNotes: '',
      minChromeVersion: '120',
    },
    'GitHub Actions (ci)',
    'Uploaded',
  );
  const id = (created._id as Types.ObjectId).toHexString();
  await runAsPlatform(() => MaReleaseModel.updateOne({ _id: id }, { $set: { status } }));
  return id;
}

const versions = async () =>
  (await runAsPlatform(() => MaReleaseModel.find().sort({ builtAt: -1 }).lean())).map(
    (release) => release.version,
  );

beforeEach(async () => {
  await runAsPlatform(() =>
    OrganizationModel.updateOne({ _id: organizationId }, { $set: { isPlatformOperator: true } }),
  );
  invalidatePlatformOperatorCache();
  const manager = await seedAccount('Root', [ROLES.ADMIN]);
  const employee = await seedAccount('Asha', [ROLES.EMPLOYEE]);
  asManager = { ...ctxOf(manager, [ROLES.ADMIN]), organizationId };
  asEmployee = {
    ...ctxOf(employee, [ROLES.EMPLOYEE]),
    organizationId: new Types.ObjectId().toHexString(),
  };
  jest.spyOn(slackNotifier, 'isConfigured').mockResolvedValue(false);
  jest.mocked(deleteReleaseZip).mockReset().mockResolvedValue();
});

afterEach(() => jest.restoreAllMocks());

describe('deleting an extension build', () => {
  it('removes the row and its ZIP, and audits who did it', async () => {
    const id = await seedRelease('1.0.0.1', 1);
    const fileId = (await runAsPlatform(() => MaReleaseModel.findById(id).lean()))?.fileId;

    await expect(maReleaseMutations.deleteMaRelease(null, { id }, asManager)).resolves.toBe(true);

    expect(await versions()).toEqual([]);
    expect(deleteReleaseZip).toHaveBeenCalledWith(fileId);
    expect(await AuditLogModel.countDocuments({ action: 'DELETE', entityLabel: '1.0.0.1' })).toBe(
      1,
    );
  });

  it('is for release managers only, and answers a missing build as not found', async () => {
    const id = await seedRelease('1.0.0.2', 2);
    expect(await codeOf(maReleaseMutations.deleteMaRelease(null, { id }, asEmployee))).toBe(
      'FORBIDDEN',
    );
    expect(await versions()).toEqual(['1.0.0.2']);
    expect(await codeOf(deleteRelease('nope'))).toBe('NOT_FOUND');
    expect(await codeOf(deleteRelease(new Types.ObjectId().toHexString()))).toBe('NOT_FOUND');
  });
});

describe('build retention', () => {
  it('keeps the newest N, and the newest downloadable build of each channel', () => {
    const release = (version: string, status: string, channel: string) =>
      ({ version, status, channel }) as unknown as LeanRelease;
    const releases = [
      release('5', 'QA_PENDING', 'STABLE'),
      release('4', 'PUBLISHED', 'STABLE'),
      release('3', 'PUBLISHED', 'STABLE'),
      release('2', 'INTERNAL_RELEASED', 'INTERNAL'),
      release('1', 'QA_PENDING', 'BETA'),
    ];
    expect(releasesBeyondRetention(releases, 1).map((r) => r.version)).toEqual(['3', '1']);
    expect(releasesBeyondRetention(releases, 0)).toEqual([]);
  });

  it('is saved by a release manager, read as 0 on a row saved before it existed', async () => {
    await runAsPlatform(() =>
      MaReleaseSettingsModel.collection.insertOne({ key: 'global', allowedRepository: 'a/b' }),
    );
    expect((await maReleaseQueries.maReleaseSettings(null, null, asManager)).keepLatestBuilds).toBe(
      0,
    );
    const saved = await maReleaseMutations.maUpdateReleaseRetention(
      null,
      { keepLatestBuilds: 3 },
      asManager,
    );
    expect(saved).toMatchObject({ keepLatestBuilds: 3, updatedByName: 'root@exyconn.com' });
  });

  it.each([
    [-1, 'Builds to keep must be a whole number, 0 or more.'],
    [1.5, 'Builds to keep must be a whole number, 0 or more.'],
    [501, 'Builds to keep can be at most 500.'],
  ])('refuses %s', async (keepLatestBuilds, message) => {
    await expect(
      maReleaseMutations.maUpdateReleaseRetention(null, { keepLatestBuilds }, asManager),
    ).rejects.toThrow(message);
  });

  it('does nothing until a count is set', async () => {
    await seedRelease('1.0.0.1', 1);
    await expect(applyReleaseRetention()).resolves.toBe(0);
    expect(await versions()).toEqual(['1.0.0.1']);
  });

  it('deletes the builds past the count, carrying on past one that fails', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    await seedRelease('1.0.0.4', 4);
    await seedRelease('1.0.0.3', 3);
    await seedRelease('1.0.0.2', 2);
    await seedRelease('1.0.0.1', 1);
    await maReleaseMutations.maUpdateReleaseRetention(null, { keepLatestBuilds: 2 }, asManager);
    jest.mocked(deleteReleaseZip).mockRejectedValueOnce(new Error('GridFS down'));

    await expect(applyReleaseRetention()).resolves.toBe(1);

    expect(await versions()).toEqual(['1.0.0.4', '1.0.0.3']);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ version: '1.0.0.2' }),
      'Could not delete an old extension build',
    );
    expect(readJobRuns().get(JOB_KEYS.meetingAssistantReleaseRetention)?.summary).toBe(
      'Kept the newest 2, deleted 1 of 2',
    );
  });

  it('is the pass the background job takes, and runs hourly from boot', async () => {
    await expect(
      findBackgroundJob(JOB_KEYS.meetingAssistantReleaseRetention)?.runOnce(),
    ).resolves.toBe(0);

    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const unref = jest.fn();
    const every = jest
      .spyOn(globalThis, 'setInterval')
      .mockReturnValue({ unref } as unknown as ReturnType<typeof setInterval>);
    jest.spyOn(MaReleaseSettingsModel, 'findOne').mockImplementation(() => {
      throw new Error('database down');
    });

    startReleaseRetention();

    expect(every).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000);
    expect(unref).toHaveBeenCalled();
    await new Promise((resolve) => setImmediate(resolve));
    expect(logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Extension build retention pass failed',
    );
  });
});
