import { projectView, shareService } from '../../../../src/modules/projects/share.service';
import { shareResolvers } from '../../../../src/modules/projects/share.resolvers';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { MilestoneModel } from '../../../../src/modules/projects/sprints.model';
import {
  TrackerIntervalModel,
  TrackerManualEntryModel,
  TrackerSessionModel,
} from '../../../../src/modules/tracker/models';
import { ROLES } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';
import { ctxFor, missingId } from './projects.fixtures';

const HOUR = 60 * 60 * 1000;
const START = new Date('2026-06-01T09:00:00.000Z');
const at = (hours: number) => new Date(START.getTime() + hours * HOUR);

const project = () => ProjectModel.create({ name: 'Acme portal', status: 'ACTIVE' });

/** One tracked session on the project, with intervals of the given active hours. */
async function trackedSession(projectId: string, activeHours: number[]) {
  const session = await TrackerSessionModel.create({
    userId: 'u1',
    deviceId: 'd1',
    startedAt: START,
    projectId,
  });
  for (const [index, hours] of activeHours.entries()) {
    await TrackerIntervalModel.create({
      userId: 'u1',
      sessionId: session._id.toHexString(),
      startedAt: at(index),
      endedAt: at(index + 1),
      activeMs: hours * HOUR,
    });
  }
}

const manualEntry = (projectId: string, hours: number, status: string) =>
  TrackerManualEntryModel.create({
    userId: 'u1',
    projectId,
    startedAt: START,
    endedAt: at(hours),
    durationMs: hours * HOUR,
    note: 'Client workshop',
    status,
  });

describe('what a client sees of a project', () => {
  it('adds tracked time to approved off-computer time, and nothing else', async () => {
    const created = await project();
    const other = await project();
    await trackedSession(created.id, [1, 0.5]);
    await trackedSession(other.id, [4]);
    await manualEntry(created.id, 0.5, 'APPROVED');
    await manualEntry(created.id, 3, 'PENDING');

    const view = await projectView(created);

    expect(view.trackedHours).toBe(2);
  });

  it('counts approved off-computer time on a project nobody has tracked', async () => {
    const created = await project();
    await manualEntry(created.id, 1.25, 'APPROVED');

    expect((await projectView(created)).trackedHours).toBe(1.25);
  });

  it('lists milestones by due date with their states, and no budget when none was set', async () => {
    const created = await project();
    const launch = new Date('2026-09-01T00:00:00.000Z');
    await MilestoneModel.create({ projectId: created.id, name: 'Launch', dueOn: launch });
    await MilestoneModel.create({
      projectId: created.id,
      name: 'Beta',
      dueOn: new Date('2026-07-01T00:00:00.000Z'),
      state: 'HIT',
    });

    const view = await projectView(created);

    expect(view.milestones.map((one) => [one.name, one.state])).toEqual([
      ['Beta', 'HIT'],
      ['Launch', 'PLANNED'],
    ]);
    expect(view.milestones[1].dueOn).toEqual(launch);
    expect(view).toMatchObject({ budgetHours: null, startDate: null, endDate: null });
  });
});

describe('issuing and revoking links', () => {
  it('refuses a link to a project that does not exist', async () => {
    expect(await codeOf(shareService.createShare(missingId(), 'Acme', 30, 'Asha'))).toBe(
      'NOT_FOUND',
    );
  });

  it('refuses to revoke a link that does not exist', async () => {
    expect(await codeOf(shareService.revokeShare(missingId()))).toBe('NOT_FOUND');
  });

  it('is projects-only for everything but following a link', async () => {
    const outsider = ctxFor(missingId(), [ROLES.CRM]);

    const listing = shareResolvers.Query.projectShares(null, { projectId: 'p' }, outsider);

    expect(await codeOf(listing)).toBe('FORBIDDEN');
    await expect(shareResolvers.Query.sharedProject(null, { token: 'nope' })).resolves.toBeNull();
  });
});
