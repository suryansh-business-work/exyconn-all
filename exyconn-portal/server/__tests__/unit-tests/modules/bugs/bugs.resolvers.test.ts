import { Types } from 'mongoose';
import { bugsResolvers } from '../../../../src/modules/bugs';
import { BugModel } from '../../../../src/modules/bugs/bugs.model';
import { projectNameFor, ticketDescription } from '../../../../src/modules/bugs/bugs.promote';
import { boardResolvers } from '../../../../src/modules/projects/board.resolvers';
import { TaskModel } from '../../../../src/modules/projects/board.model';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { seedUser } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

const PASSWORD = process.env.TEST_USER_PASSWORD ?? `pw-${'x'.repeat(12)}`;
const DUE = new Date('2026-11-30T00:00:00.000Z');

const ctxFor = (id: string, roles: Role[] = [ROLES.PROJECTS]): GraphQLContext => ({
  user: { id, roles, email: 'lead@exyconn.com' },
});

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<Record<string, unknown>>;
const mutation = bugsResolvers.Mutation as unknown as Record<string, Resolver>;

const bugInput = (overrides: Record<string, unknown>) => ({
  title: 'Export hangs',
  description: 'The CSV export never finishes',
  severity: 'LOW',
  status: 'OPEN',
  dueDate: DUE,
  ...overrides,
});

async function setup() {
  const lead = await seedUser('lead@exyconn.com', PASSWORD, [ROLES.PROJECTS]);
  const ctx = ctxFor(lead.id);
  const project = await ProjectModel.create({ name: 'Billing', status: 'ACTIVE' });
  return { lead, ctx, projectId: project._id.toHexString() };
}

describe('updateBug', () => {
  it('re-resolves the project and assignee names from their ids on every edit', async () => {
    const { lead, ctx, projectId } = await setup();
    const created = await mutation.createBug(
      null,
      { input: bugInput({ assigneeId: lead.id }) },
      ctx,
    );
    expect(created.projectName).toBe('');

    const updated = await mutation.updateBug(
      null,
      {
        id: created.id,
        input: bugInput({ projectId, assigneeId: lead.id, projectName: 'Forged' }),
      },
      ctx,
    );

    expect(updated).toMatchObject({ projectId, projectName: 'Billing', assigneeName: 'lead' });
  });

  it('refuses a project id that matches no project', async () => {
    const { lead, ctx } = await setup();
    const created = await mutation.createBug(
      null,
      { input: bugInput({ assigneeId: lead.id }) },
      ctx,
    );
    const missing = new Types.ObjectId().toHexString();

    const attempt = mutation.updateBug(
      null,
      { id: created.id, input: bugInput({ projectId: missing, assigneeId: lead.id }) },
      ctx,
    );

    await expect(attempt).rejects.toThrow(/project does not exist/);
  });
});

describe('createBug', () => {
  it('files a bug with no assignee and no due date', async () => {
    const { ctx, projectId } = await setup();

    const created = await mutation.createBug(
      null,
      { input: bugInput({ projectId, assigneeId: null, dueDate: null }) },
      ctx,
    );

    expect(created).toMatchObject({ assigneeId: '', assigneeName: '', dueDate: null });
  });

  it('keeps the steps, the links and the files, stamping who attached them', async () => {
    const { ctx, projectId } = await setup();

    const created = await mutation.createBug(
      null,
      {
        input: bugInput({
          projectId,
          stepsToReproduce: '<ol><li>Export</li></ol>',
          publicLink: 'https://app.exyconn.com/export',
          privateLink: 'https://staging.exyconn.com/export',
          attachments: [{ url: ' https://cdn/a.png ', name: 'a.png', contentType: 'image/png' }],
        }),
      },
      ctx,
    );

    expect(created).toMatchObject({
      stepsToReproduce: '<ol><li>Export</li></ol>',
      publicLink: 'https://app.exyconn.com/export',
      privateLink: 'https://staging.exyconn.com/export',
    });
    const stored = await BugModel.findById(created.id).lean();
    expect(stored?.attachments).toEqual([
      expect.objectContaining({
        url: 'https://cdn/a.png',
        name: 'a.png',
        contentType: 'image/png',
        uploadedBy: 'lead@exyconn.com',
      }),
    ]);
  });
});

describe('projectNameFor', () => {
  it('is empty for a bug on no project', async () => {
    expect(await projectNameFor(null)).toBe('');
    expect(await projectNameFor(undefined)).toBe('');
  });

  it('refuses an id that is not an object id at all', async () => {
    await expect(projectNameFor('not-an-id')).rejects.toThrow(/project does not exist/);
  });
});

describe('Bug field resolvers on rows that predate the fields', () => {
  it('reads absent names, ids and keys as empty strings', () => {
    const legacy = { projectName: null, assigneeId: null, assigneeName: null, taskKey: null };

    expect(bugsResolvers.Bug.projectName(legacy)).toBe('');
    expect(bugsResolvers.Bug.assigneeId(legacy)).toBe('');
    expect(bugsResolvers.Bug.assigneeName({ assigneeName: '', assignee: '' })).toBe('');
    expect(bugsResolvers.Bug.taskKey(legacy)).toBe('');
    expect(bugsResolvers.Bug.stepsToReproduce({})).toBe('');
    expect(bugsResolvers.Bug.publicLink({})).toBe('');
    expect(bugsResolvers.Bug.privateLink({})).toBe('');
    expect(bugsResolvers.Bug.attachments({})).toEqual([]);
  });

  it('prefers the stored values when present', () => {
    const row = { projectName: 'Billing', assigneeId: 'u1', assigneeName: 'Asha', taskKey: 'B-2' };

    expect(bugsResolvers.Bug.projectName(row)).toBe('Billing');
    expect(bugsResolvers.Bug.assigneeId(row)).toBe('u1');
    expect(bugsResolvers.Bug.assigneeName({ ...row, assignee: 'Old Text' })).toBe('Asha');
    expect(bugsResolvers.Bug.taskKey(row)).toBe('B-2');
    const file = { url: 'u', name: 'n', contentType: 'c', uploadedBy: 'b', uploadedAt: DUE };
    const filed = {
      stepsToReproduce: '<p>1</p>',
      publicLink: 'https://a',
      privateLink: 'https://b',
      attachments: [file],
    };
    expect(bugsResolvers.Bug.stepsToReproduce(filed)).toBe('<p>1</p>');
    expect(bugsResolvers.Bug.publicLink(filed)).toBe('https://a');
    expect(bugsResolvers.Bug.privateLink(filed)).toBe('https://b');
    expect(bugsResolvers.Bug.attachments(filed)).toEqual([file]);
  });
});

describe('ticketDescription', () => {
  it('adds the steps to reproduce under a heading, when there are any', () => {
    expect(ticketDescription('<p>Breaks</p>', '<ol><li>Go</li></ol>')).toBe(
      '<p>Breaks</p><h3>Steps to reproduce</h3><ol><li>Go</li></ol>',
    );
    expect(ticketDescription('<p>Breaks</p>', '')).toBe('<p>Breaks</p>');
    expect(ticketDescription('<p>Breaks</p>', null)).toBe('<p>Breaks</p>');
  });
});

describe('promoteBugToTask', () => {
  const promote = (ctx: GraphQLContext, id: string) =>
    bugsResolvers.Mutation.promoteBugToTask(null, { id }, ctx) as Promise<{
      priority: string;
      assigneeId: string;
    }>;

  it('refuses a bug that does not exist', async () => {
    const { ctx } = await setup();

    await expect(promote(ctx, new Types.ObjectId().toHexString())).rejects.toThrow(
      /bug does not exist/,
    );
  });

  it('opens an unassigned ticket for a legacy bug with no assignee id', async () => {
    const { ctx, projectId } = await setup();
    await boardResolvers.Mutation.createColumn(null, { projectId, name: 'Backlog' }, ctx);
    const legacy = await BugModel.create({ ...bugInput({ projectId }), severity: 'MEDIUM' });

    const task = await promote(ctx, legacy._id.toHexString());

    expect(task.priority).toBe('MEDIUM');
    expect(task.assigneeId).toBe('');
    expect(await TaskModel.countDocuments({ projectId, type: 'BUG' })).toBe(1);
  });

  it('refuses somebody without the Projects role', async () => {
    const { projectId } = await setup();
    const bug = await BugModel.create(bugInput({ projectId }));
    const outsider = ctxFor(new Types.ObjectId().toHexString(), [ROLES.HR]);

    expect(await codeOf(promote(outsider, bug._id.toHexString()))).toBe('FORBIDDEN');
    expect(await BugModel.findById(bug._id).lean()).toMatchObject({ taskId: '' });
  });
});
