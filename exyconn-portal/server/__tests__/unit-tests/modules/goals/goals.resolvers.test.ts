import { Types } from 'mongoose';
import { GoalModel } from '../../../../src/modules/goals/goal.model';
import { goalsResolvers } from '../../../../src/modules/goals';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { asArg } from '../../../mockAs';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const G = { ...goalsResolvers.Query, ...goalsResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;

const ctx = (id: string, roles: string[] = [ROLES.EMPLOYEE]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

const newId = () => String(new Types.ObjectId());

const goal = (employeeId: string, over: Record<string, unknown> = {}) =>
  GoalModel.create({
    employeeId,
    title: 'Ship it',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-06-30'),
    ...over,
  });

const person = (name: string, managerId: string | null = null) =>
  UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    managerId,
    isActive: true,
  });

describe('teamGoals', () => {
  it('is empty for somebody who manages nobody, without reading any goal', async () => {
    const loner = await person('Lone');
    await goal(newId());

    await expect(G.teamGoals(null, {}, ctx(String(loner._id)))).resolves.toEqual([]);
  });

  it("lists only the direct reports' goals, latest end date first", async () => {
    const manager = await person('Meera');
    const report = await person('Ravi', String(manager._id));
    const reportId = String(report._id);
    await goal(reportId, { title: 'Early', endDate: new Date('2026-02-01') });
    await goal(reportId, { title: 'Late', endDate: new Date('2026-09-01') });
    await goal(newId(), { title: 'Stranger' });

    const rows = (await G.teamGoals(null, {}, ctx(String(manager._id)))) as Array<{
      id: string;
      title: string;
    }>;

    expect(rows.map((row) => row.title)).toEqual(['Late', 'Early']);
    expect(rows[0].id).toEqual(expect.any(String));
  });

  it('refuses a caller who is not signed in', async () => {
    await expect(G.teamGoals(null, {}, asArg({ user: null }))).rejects.toThrow(
      /Authentication required/,
    );
  });
});

describe('updateMyGoalProgress', () => {
  it.each([-1, 101])('refuses progress of %d before touching the goal', async (progress) => {
    const me = newId();
    const row = await goal(me);

    await expect(
      G.updateMyGoalProgress(null, { id: String(row._id), progress }, ctx(me)),
    ).rejects.toThrow(/between 0 and 100/);
    expect((await GoalModel.findById(row._id))?.progress).toBe(0);
  });

  it('accepts the 100% boundary on the employee’s own goal', async () => {
    const me = newId();
    const row = await goal(me);

    const updated = (await G.updateMyGoalProgress(
      null,
      { id: String(row._id), progress: 100 },
      ctx(me),
    )) as { id: string; progress: number };

    expect(updated).toMatchObject({ id: String(row._id), progress: 100 });
    expect((await GoalModel.findById(row._id))?.progress).toBe(100);
  });
});

describe('commentOnTeamGoal', () => {
  it('says the goal is missing for an unknown id', async () => {
    await expect(
      G.commentOnTeamGoal(null, { id: newId(), comment: 'Hi' }, ctx(newId(), [ROLES.HR])),
    ).rejects.toThrow(/Goal not found/);
  });

  it('keeps HR from writing the manager’s comment on their own goal', async () => {
    const me = newId();
    const row = await goal(me);

    await expect(
      G.commentOnTeamGoal(null, { id: String(row._id), comment: 'Great' }, ctx(me, [ROLES.HR])),
    ).rejects.toThrow(/cannot write the manager’s comment for yourself/);
    expect((await GoalModel.findById(row._id))?.managerComment).toBeNull();
  });

  it('lets HR comment on somebody else’s goal', async () => {
    const row = await goal(newId());

    const updated = (await G.commentOnTeamGoal(
      null,
      { id: String(row._id), comment: 'Keep going' },
      ctx(newId(), [ROLES.HR]),
    )) as { managerComment: string };

    expect(updated.managerComment).toBe('Keep going');
  });
});

describe('HR goal writes', () => {
  const input = (employeeId: string) => ({
    employeeId,
    title: 'Grow',
    description: '',
    kpi: '',
    weightage: 20,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-06-30'),
    progress: 0,
    status: 'ACTIVE',
  });

  it('refuses HR creating a goal for themselves', async () => {
    const me = newId();

    // The create guard throws synchronously, so call it inside an async function.
    await expect(async () =>
      G.createGoal(null, { input: input(me) }, ctx(me, [ROLES.HR])),
    ).rejects.toThrow(/cannot edit your own Goal/);
    expect(await GoalModel.countDocuments()).toBe(0);
  });

  it('refuses HR editing a goal that is already theirs, even without naming the employee', async () => {
    const me = newId();
    const row = await goal(me);

    await expect(
      G.updateGoal(
        null,
        { id: String(row._id), input: { title: 'Mine now' } },
        ctx(me, [ROLES.HR]),
      ),
    ).rejects.toThrow(/cannot edit your own Goal/);
    expect((await GoalModel.findById(row._id))?.title).toBe('Ship it');
  });

  it('lets HR edit somebody else’s goal', async () => {
    const row = await goal(newId());

    const updated = (await G.updateGoal(
      null,
      { id: String(row._id), input: { title: 'Ship it twice' } },
      ctx(newId(), [ROLES.HR]),
    )) as { title: string };

    expect(updated.title).toBe('Ship it twice');
  });

  it('reports a goal that does not exist rather than treating it as nobody’s', async () => {
    await expect(
      G.updateGoal(null, { id: newId(), input: { title: 'Ghost' } }, ctx(newId(), [ROLES.HR])),
    ).rejects.toThrow(/Goal not found/);
  });
});
