import { createHash } from 'node:crypto';
import { hashShareToken, isShareLive, shareService } from '../../src/modules/projects/share.service';
import { shareResolvers } from '../../src/modules/projects/share.resolvers';
import { ProjectShareModel } from '../../src/modules/projects/share.model';
import { ProjectModel } from '../../src/modules/projects/projects.model';
import { MilestoneModel } from '../../src/modules/projects/sprints.model';
import { boardResolvers } from '../../src/modules/projects/board.resolvers';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

const PASSWORD = process.env.TEST_USER_PASSWORD ?? 'a-strong-password';

const asProjects = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.PROJECTS], email: 'lead@exyconn.com' },
});

const lead = () => seedUser('lead@exyconn.com', PASSWORD, [ROLES.PROJECTS]);

const project = () =>
  ProjectModel.create({
    name: 'Acme portal',
    status: 'ACTIVE',
    clientName: 'Acme',
    budgetHours: 100,
  });

/** The token out of a created share's one-time URL. */
const tokenOf = (url: string) => url.slice(url.lastIndexOf('/') + 1);

describe('share tokens', () => {
  it('stores only the SHA-256 hash of the token, never the token', async () => {
    const created = await project();

    const { share, token } = await shareService.createShare(created.id, 'Acme', 30, 'Asha');

    expect(share.tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
    expect(share.tokenHash).not.toContain(token);
    const stored = await ProjectShareModel.findById(share._id).lean();
    expect(JSON.stringify(stored)).not.toContain(token);
  });

  it('hands out a different token every time', async () => {
    const created = await project();

    const first = await shareService.createShare(created.id, 'One', 30, 'Asha');
    const second = await shareService.createShare(created.id, 'Two', 30, 'Asha');

    expect(first.token).not.toBe(second.token);
  });

  it('hashes the same token to the same value, and a different one differently', () => {
    expect(hashShareToken('abc')).toBe(hashShareToken('abc'));
    expect(hashShareToken('abc')).not.toBe(hashShareToken('abd'));
  });

  it('refuses an expiry outside one day to a year', async () => {
    const created = await project();

    await expect(shareService.createShare(created.id, 'Acme', 0, 'Asha')).rejects.toThrow(
      /between 1 and 365 days/,
    );
    await expect(shareService.createShare(created.id, 'Acme', 366, 'Asha')).rejects.toThrow(
      /between 1 and 365 days/,
    );
  });
});

describe('isShareLive', () => {
  const now = new Date('2026-09-07T00:00:00.000Z');

  it('is live while the expiry is in the future', () => {
    expect(isShareLive({ expiresAt: new Date('2026-09-08T00:00:00.000Z') }, now)).toBe(true);
  });

  it('is dead once the expiry has passed', () => {
    expect(isShareLive({ expiresAt: new Date('2026-09-06T00:00:00.000Z') }, now)).toBe(false);
  });

  it('is dead when revoked, however far off the expiry is', () => {
    expect(
      isShareLive(
        { expiresAt: new Date('2027-01-01T00:00:00.000Z'), revokedAt: new Date() },
        now,
      ),
    ).toBe(false);
  });
});

describe('sharedProject', () => {
  it('answers a live token with the project a client may see', async () => {
    const created = await project();
    await MilestoneModel.create({ projectId: created.id, name: 'Go live', state: 'PLANNED' });
    const { token } = await shareService.createShare(created.id, 'Acme', 30, 'Asha');

    const view = await shareService.sharedProject(token);

    expect(view?.name).toBe('Acme portal');
    expect(view?.clientName).toBe('Acme');
    expect(view?.budgetHours).toBe(100);
    expect(view?.milestones).toEqual([{ name: 'Go live', dueOn: null, state: 'PLANNED' }]);
  });

  it('counts tickets by the column they sit in, in board order', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const todo = await boardResolvers.Mutation.createColumn(
      null,
      { projectId: created.id, name: 'To do' },
      ctx,
    );
    await boardResolvers.Mutation.createColumn(null, { projectId: created.id, name: 'Done' }, ctx);
    await boardResolvers.Mutation.createTask(
      null,
      { projectId: created.id, columnId: todo.id, input: { title: 'One' } },
      ctx,
    );
    const { token } = await shareService.createShare(created.id, 'Acme', 30, 'Asha');

    const view = await shareService.sharedProject(token);

    expect(view?.ticketCounts).toEqual([
      { status: 'To do', count: 1 },
      { status: 'Done', count: 0 },
    ]);
  });

  it('answers null for a token nobody issued', async () => {
    expect(await shareService.sharedProject('not-a-token')).toBeNull();
  });

  it('answers null once the link has expired', async () => {
    const created = await project();
    const { share, token } = await shareService.createShare(created.id, 'Acme', 30, 'Asha');
    await ProjectShareModel.updateOne(
      { _id: share._id },
      { expiresAt: new Date(Date.now() - 1000) },
    );

    expect(await shareService.sharedProject(token)).toBeNull();
  });

  it('answers null once the link has been revoked', async () => {
    const created = await project();
    const { share, token } = await shareService.createShare(created.id, 'Acme', 30, 'Asha');

    await shareService.revokeShare(String(share._id));

    expect(await shareService.sharedProject(token)).toBeNull();
  });

  it('answers null when the project behind a live link has been deleted', async () => {
    const created = await project();
    const { token } = await shareService.createShare(created.id, 'Acme', 30, 'Asha');

    await ProjectModel.findByIdAndDelete(created.id);

    expect(await shareService.sharedProject(token)).toBeNull();
  });
});

describe('share resolvers', () => {
  it('returns the one-time URL and marks the link live', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();

    const result = await shareResolvers.Mutation.createProjectShare(
      null,
      { projectId: created.id, label: 'Acme weekly', expiresInDays: 30 },
      ctx,
    );

    expect(result.url).toContain('/project/');
    expect(result.share.isLive).toBe(true);
    expect(result.share.createdByName).toBe('lead');
    expect(await shareService.sharedProject(tokenOf(result.url))).not.toBeNull();
  });

  it('lists a revoked link as no longer live', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const made = await shareResolvers.Mutation.createProjectShare(
      null,
      { projectId: created.id, label: 'Acme weekly', expiresInDays: 30 },
      ctx,
    );

    await shareResolvers.Mutation.revokeProjectShare(null, { id: made.share.id }, ctx);

    const [listed] = await shareResolvers.Query.projectShares(null, { projectId: created.id }, ctx);
    expect(listed.isLive).toBe(false);
    expect(listed.revokedAt).not.toBeNull();
  });

  it('reads a shared project without any authentication at all', async () => {
    const created = await project();
    const { token } = await shareService.createShare(created.id, 'Acme', 30, 'Asha');

    const view = await shareResolvers.Query.sharedProject(null, { token });

    expect(view?.name).toBe('Acme portal');
  });
});
