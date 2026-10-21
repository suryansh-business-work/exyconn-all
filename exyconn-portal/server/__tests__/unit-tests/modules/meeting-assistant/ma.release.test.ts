import { Types } from 'mongoose';
import { useTestOrganization } from '../../../helpers';
import {
  maReleaseMutations,
  maReleaseQueries,
} from '../../../../src/modules/meeting-assistant/ma.release.resolvers';
import {
  registerRelease,
  releaseByVersion,
} from '../../../../src/modules/meeting-assistant/releases.service';
import { announcePublished } from '../../../../src/modules/meeting-assistant/releases.notify';
import { EXTENSION_WORKFLOW_FILE } from '../../../../src/modules/meeting-assistant/releases.github';
import {
  DEFAULT_RELEASE_REPOSITORY,
  MaReleaseModel,
  MaReleaseSettingsModel,
} from '../../../../src/modules/meeting-assistant/models';
import { githubActions } from '../../../../src/utils/github';
import { slackNotifier } from '../../../../src/utils/slack';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { ctxOf, seedAccount } from './ma.fixtures';

jest.mock('../../../../src/modules/meeting-assistant/releases.notify', () => ({
  announcePublished: jest.fn(),
}));
jest.mock('../../../../src/utils/github', () => ({
  githubActions: { dispatchWorkflow: jest.fn() },
}));

const dispatch = githubActions.dispatchWorkflow as jest.Mock;
const organizationId = useTestOrganization();

let asEmployee: GraphQLContext;
/** An ADMIN of the platform operator organization: a release manager. */
let asManager: GraphQLContext;

/** A build as CI uploads it, then moved straight to `status` when one is given. */
async function seedRelease(version: string, status?: string) {
  const created = await registerRelease(
    {
      version,
      channel: 'INTERNAL',
      buildNumber: 1,
      commitSha: 'abcdef1',
      builtAt: new Date('2026-10-01T00:00:00Z'),
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
  if (status) {
    await runAsPlatform(() => MaReleaseModel.updateOne({ _id: id }, { $set: { status } }));
  }
  return id;
}

const approve = (id: string, channel: 'STABLE' | 'BETA' | 'INTERNAL', ctx = asManager) =>
  maReleaseMutations.maApproveRelease(null, { id, channel }, ctx);

const settingsInput = (overrides: Record<string, unknown> = {}) => ({
  allowedRepository: ' acme/portal ',
  slackChannelId: 'C1',
  notifyOnNewBuild: true,
  ...overrides,
});

beforeEach(async () => {
  await runAsPlatform(() =>
    OrganizationModel.updateOne({ _id: organizationId }, { $set: { isPlatformOperator: true } }),
  );
  invalidatePlatformOperatorCache();
  const employee = await seedAccount('Asha', [ROLES.EMPLOYEE]);
  const manager = await seedAccount('Root', [ROLES.ADMIN]);
  asEmployee = {
    ...ctxOf(employee, [ROLES.EMPLOYEE]),
    organizationId: new Types.ObjectId().toHexString(),
  };
  asManager = { ...ctxOf(manager, [ROLES.ADMIN]), organizationId };
  jest.spyOn(slackNotifier, 'isConfigured').mockResolvedValue(true);
  jest
    .spyOn(slackNotifier, 'listChannels')
    .mockResolvedValue([{ id: 'C1', name: 'releases', isPrivate: false, isMember: true }]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('maReleaseOverview', () => {
  it('counts the builds and those awaiting approval for a release manager', async () => {
    await seedRelease('1.0.0');
    await seedRelease('1.0.1', 'READY_FOR_INTERNAL_TESTING');
    await seedRelease('1.0.2', 'DEPRECATED');

    expect(await maReleaseQueries.maReleaseOverview(null, null, asManager)).toEqual({
      releaseManager: true,
      registered: 3,
      awaitingApproval: 2,
    });
  });

  it('tells anybody else nothing about the builds', async () => {
    await seedRelease('1.0.0');

    expect(await maReleaseQueries.maReleaseOverview(null, null, asEmployee)).toEqual({
      releaseManager: false,
      registered: 0,
      awaitingApproval: 0,
    });
  });
});

describe('maApproveRelease', () => {
  it('releases a build waiting for QA on the chosen channel, recording both steps', async () => {
    const id = await seedRelease('1.2.0');

    const approved = await approve(id, 'BETA');

    expect(approved).toMatchObject({
      id,
      status: 'INTERNAL_RELEASED',
      channel: 'BETA',
      downloadable: true,
    });
    expect(approved.statusHistory.map((event) => [event.status, event.byName, event.note])).toEqual(
      [
        ['QA_PENDING', 'GitHub Actions (ci)', 'Uploaded'],
        ['READY_FOR_INTERNAL_TESTING', 'root@exyconn.com', 'Approved for the BETA channel'],
        ['INTERNAL_RELEASED', 'root@exyconn.com', 'Approved for the BETA channel'],
      ],
    );
    expect(announcePublished).toHaveBeenCalledWith(
      expect.objectContaining({ version: '1.2.0', status: 'INTERNAL_RELEASED' }),
    );
  });

  it('takes a build already in testing straight to released', async () => {
    const id = await seedRelease('1.2.1', 'READY_FOR_INTERNAL_TESTING');

    const approved = await approve(id, 'STABLE');

    expect(approved.statusHistory.map((event) => event.status)).toEqual([
      'QA_PENDING',
      'INTERNAL_RELEASED',
    ]);
    expect((await releaseByVersion('1.2.1'))?.channel).toBe('STABLE');
  });

  it('refuses a build not waiting for approval, an unknown one and anyone but a manager', async () => {
    const released = await seedRelease('1.2.2', 'INTERNAL_RELEASED');
    const waiting = await seedRelease('1.2.3');

    expect(await codeOf(approve(released, 'STABLE'))).toBe('BAD_USER_INPUT');
    expect(await codeOf(approve(new Types.ObjectId().toHexString(), 'STABLE'))).toBe('NOT_FOUND');
    expect(await codeOf(approve(waiting, 'STABLE', asEmployee))).toBe('FORBIDDEN');
    expect((await releaseByVersion('1.2.3'))?.status).toBe('QA_PENDING');
    expect(announcePublished).not.toHaveBeenCalled();
  });
});

describe('maStartExtensionBuild', () => {
  it('dispatches the release workflow on main with the channel', async () => {
    dispatch.mockResolvedValue(undefined);

    expect(
      await maReleaseMutations.maStartExtensionBuild(null, { channel: 'BETA' }, asManager),
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith(EXTENSION_WORKFLOW_FILE, 'main', { channel: 'BETA' });
    expect(EXTENSION_WORKFLOW_FILE).toBe('meet-extension-release.yml');
  });

  it('passes on a GitHub failure, and refuses anyone but a manager', async () => {
    dispatch.mockRejectedValue(new Error('GitHub /actions/workflows failed (404)'));

    await expect(
      maReleaseMutations.maStartExtensionBuild(null, { channel: 'STABLE' }, asManager),
    ).rejects.toThrow('GitHub /actions/workflows failed (404)');
    expect(
      await codeOf(
        maReleaseMutations.maStartExtensionBuild(null, { channel: 'STABLE' }, asEmployee),
      ),
    ).toBe('FORBIDDEN');
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('release settings', () => {
  it('starts from the defaults, created once, with whether Slack is set up', async () => {
    const first = await maReleaseQueries.maReleaseSettings(null, null, asManager);
    jest.spyOn(slackNotifier, 'isConfigured').mockResolvedValue(false);
    const second = await maReleaseQueries.maReleaseSettings(null, null, asManager);

    expect(first).toMatchObject({
      allowedRepository: DEFAULT_RELEASE_REPOSITORY,
      slackChannelId: '',
      slackChannelName: '',
      notifyOnNewBuild: false,
      slackConfigured: true,
    });
    expect(second.slackConfigured).toBe(false);
    expect(await runAsPlatform(() => MaReleaseSettingsModel.countDocuments())).toBe(1);
  });

  it('lists the Slack channels to a manager only', async () => {
    expect(await maReleaseQueries.maReleaseSlackChannels(null, null, asManager)).toEqual([
      { id: 'C1', name: 'releases', isPrivate: false, isMember: true },
    ]);
    expect(await codeOf(maReleaseQueries.maReleaseSlackChannels(null, null, asEmployee))).toBe(
      'FORBIDDEN',
    );
    expect(await codeOf(maReleaseQueries.maReleaseSettings(null, null, asEmployee))).toBe(
      'FORBIDDEN',
    );
  });

  it('saves the trimmed repository and a channel the Slack app can see, with its name', async () => {
    const saved = await maReleaseMutations.maUpdateReleaseSettings(
      null,
      { input: settingsInput() },
      asManager,
    );

    expect(saved).toMatchObject({
      allowedRepository: 'acme/portal',
      slackChannelId: 'C1',
      slackChannelName: 'releases',
      notifyOnNewBuild: true,
      updatedByName: 'root@exyconn.com',
      slackConfigured: true,
    });
  });

  it('keeps the saved channel without asking Slack, and clears it without asking either', async () => {
    await maReleaseMutations.maUpdateReleaseSettings(null, { input: settingsInput() }, asManager);
    const channels = jest.mocked(slackNotifier.listChannels);
    channels.mockClear().mockRejectedValue(new Error('Slack is not configured'));

    const kept = await maReleaseMutations.maUpdateReleaseSettings(
      null,
      { input: settingsInput({ allowedRepository: 'acme/other' }) },
      asManager,
    );
    const cleared = await maReleaseMutations.maUpdateReleaseSettings(
      null,
      { input: settingsInput({ slackChannelId: ' ' }) },
      asManager,
    );

    expect(kept).toMatchObject({ allowedRepository: 'acme/other', slackChannelName: 'releases' });
    expect(cleared).toMatchObject({ slackChannelId: '', slackChannelName: '' });
    expect(channels).not.toHaveBeenCalled();
  });

  it('refuses a repository that is not owner/name, a channel Slack does not show, and non-managers', async () => {
    const refused = [
      settingsInput({ allowedRepository: 'acme' }),
      settingsInput({ allowedRepository: 'acme/portal/extra' }),
      settingsInput({ allowedRepository: 'acme portal/x' }),
    ];
    const codes = await Promise.all(
      refused.map((input) =>
        codeOf(maReleaseMutations.maUpdateReleaseSettings(null, { input }, asManager)),
      ),
    );
    const unknownChannel = await codeOf(
      maReleaseMutations.maUpdateReleaseSettings(
        null,
        { input: settingsInput({ slackChannelId: 'C404' }) },
        asManager,
      ),
    );

    expect(codes).toEqual(refused.map(() => 'BAD_USER_INPUT'));
    expect(unknownChannel).toBe('BAD_USER_INPUT');
    expect(
      await codeOf(
        maReleaseMutations.maUpdateReleaseSettings(null, { input: settingsInput() }, asEmployee),
      ),
    ).toBe('FORBIDDEN');
    expect(await maReleaseQueries.maReleaseSettings(null, null, asManager)).toMatchObject({
      allowedRepository: DEFAULT_RELEASE_REPOSITORY,
      slackChannelId: '',
    });
  });
});
