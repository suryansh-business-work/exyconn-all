import { goalsResolvers } from '../../src/modules/goals';
import { adminResolvers } from '../../src/modules/admin/admin.resolvers';
import { AuditLogModel, diffChanges, entityLabelOf } from '../../src/modules/audit';
import { GoalModel } from '../../src/modules/goals/goal.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const G = { ...goalsResolvers.Query, ...goalsResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;
const A = { ...adminResolvers.Mutation } as unknown as Record<string, Resolver>;

const goalInput = {
  employeeId: 'e1',
  title: 'Ship',
  description: '',
  kpi: '',
  weightage: 10,
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-01'),
  progress: 0,
  status: 'ACTIVE',
};

async function adminCtx(): Promise<GraphQLContext> {
  const admin = await seedUser('root@exyconn.com', 'Root@1234', [ROLES.ADMIN]);
  return { user: { id: admin.id, email: admin.email, roles: [ROLES.ADMIN] }, ip: '10.0.0.1' };
}

describe('audit log', () => {
  it('records a generated CRUD update with the diff of the fields that changed', async () => {
    const ctx = await adminCtx();
    const created = (await G.createGoal(null, { input: goalInput }, ctx)) as { id: string };
    await G.updateGoal(
      null,
      { id: created.id, input: { ...goalInput, title: 'Ship it', progress: 40 } },
      ctx,
    );

    const rows = await AuditLogModel.find({ module: 'Goal' }).sort({ createdAt: 1 }).lean();
    expect(rows.map((row) => row.action)).toEqual(['CREATE', 'UPDATE']);

    const update = rows[1];
    expect(update.entityId).toBe(created.id);
    expect(update.entityLabel).toBe('Ship it');
    expect(update.actorName).toBe('root');
    expect(update.actorEmail).toBe('root@exyconn.com');
    expect(update.ip).toBe('10.0.0.1');
    expect(update.summary).toBe('Updated Goal (title, progress)');
    expect(JSON.parse(update.changes)).toEqual({
      title: { from: 'Ship', to: 'Ship it' },
      progress: { from: 0, to: 40 },
    });
  });

  it('records a delete with the label of the row that was removed', async () => {
    const ctx = await adminCtx();
    const created = (await G.createGoal(null, { input: goalInput }, ctx)) as { id: string };
    await G.deleteGoal(null, { id: created.id }, ctx);

    const row = await AuditLogModel.findOne({ module: 'Goal', action: 'DELETE' }).lean();
    expect(row?.entityLabel).toBe('Ship');
    expect(row?.entityId).toBe(created.id);
  });

  it('records a role change on a user as ROLE_CHANGE', async () => {
    const ctx = await adminCtx();
    const target = await seedUser('emp@exyconn.com', 'Emp@1234', [ROLES.EMPLOYEE]);

    await A.updateUser(null, { id: target.id, input: { roles: [ROLES.HR, ROLES.EMPLOYEE] } }, ctx);
    const row = await AuditLogModel.findOne({ module: 'User', entityId: target.id }).lean();
    expect(row?.action).toBe('ROLE_CHANGE');
    expect(row?.entityLabel).toBe('emp@exyconn.com');
    expect(row?.summary).toBe('Changed roles of emp from [EMPLOYEE] to [EMPLOYEE, HR]');
    expect(JSON.parse(row?.changes ?? '{}')).toEqual({
      roles: { from: ['EMPLOYEE'], to: ['HR', 'EMPLOYEE'] },
    });
  });

  it('records a plain user edit as UPDATE when the roles are unchanged', async () => {
    const ctx = await adminCtx();
    const target = await seedUser('emp@exyconn.com', 'Emp@1234', [ROLES.EMPLOYEE]);

    await A.updateUser(
      null,
      { id: target.id, input: { name: 'Renamed', roles: ['EMPLOYEE'] } },
      ctx,
    );
    const row = await AuditLogModel.findOne({ module: 'User', entityId: target.id }).lean();
    expect(row?.action).toBe('UPDATE');
  });

  it('never fails the mutation when the audit write fails', async () => {
    const ctx = await adminCtx();
    jest.spyOn(AuditLogModel, 'create').mockRejectedValueOnce(new Error('audit down'));

    await expect(G.createGoal(null, { input: goalInput }, ctx)).resolves.toMatchObject({
      title: 'Ship',
    });
    expect(await GoalModel.countDocuments()).toBe(1);
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });

  it('diffs only the fields in the input, skips secrets and caps the row', () => {
    const before = { name: 'A', passwordHash: 'old', when: new Date('2026-01-01'), n: 1 };
    const changes = diffChanges(before, {
      name: 'B',
      passwordHash: 'new',
      when: new Date('2026-02-01'),
      n: 1,
    });
    expect(changes).toEqual({
      name: { from: 'A', to: 'B' },
      when: { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' },
    });

    const wide = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`f${i}`, i]));
    expect(Object.keys(diffChanges({}, wide))).toHaveLength(8);
  });

  it('labels a row by whichever naming field it has', () => {
    expect(entityLabelOf({ number: 'INV-1', name: '' })).toBe('INV-1');
    expect(entityLabelOf({ subject: 'Help' })).toBe('Help');
    expect(entityLabelOf({ amount: 3 })).toBe('');
  });
});
