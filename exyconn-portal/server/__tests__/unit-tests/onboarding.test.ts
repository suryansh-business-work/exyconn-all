import { onboardingResolvers } from '../../src/modules/onboarding';
import {
  OnboardingChecklistModel,
  OnboardingTemplateModel,
  progressPercent,
} from '../../src/modules/onboarding/onboarding.model';
import {
  DEFAULT_TEMPLATE_NAME,
  ensureOnboardingDefaults,
} from '../../src/modules/onboarding/onboarding.defaults';
import { NotificationModel } from '../../src/modules/notifications';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: never, c: GraphQLContext) => Promise<never>;
const M = onboardingResolvers.Mutation as unknown as Record<string, Resolver>;
const Q = onboardingResolvers.Query as unknown as Record<string, Resolver>;

const ctxFor = (id: string, roles: string[]): GraphQLContext =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

const hr = ctxFor('hr-user', [ROLES.HR]);
const it_ = ctxFor('it-user', [ROLES.IT]);

interface Checklist {
  id: string;
  employeeId: string;
  employeeName: string;
  templateName: string;
  items: Array<{ key: string; owner: string; done: boolean; doneByName: string | null; notes: string }>;
}

const JOIN_DATE = new Date('2026-09-01T00:00:00.000Z');

async function joiner(email = 'joiner@exyconn.com') {
  const user = await seedUser(email, 'whatever123', [ROLES.EMPLOYEE]);
  await UserModel.updateOne({ _id: user._id }, { joinDate: JOIN_DATE, name: 'Riya Sen' });
  return String(user._id);
}

async function template(tasks?: Array<Record<string, unknown>>) {
  const created = await OnboardingTemplateModel.create({
    name: 'Standard onboarding',
    active: true,
    tasks: tasks ?? [
      { key: 'laptop', label: 'Issue laptop', owner: 'IT', dueDaysFromJoin: 0 },
      { key: 'policies', label: 'Sign the policies', owner: 'EMPLOYEE', dueDaysFromJoin: 3 },
    ],
  });
  return String(created._id);
}

const start = (employeeId: string, templateId: string, ctx = hr) =>
  M.startOnboarding(null, { employeeId, templateId } as never, ctx) as unknown as Promise<Checklist>;

const tick = (
  checklistId: string,
  key: string,
  done: boolean,
  ctx: GraphQLContext,
  notes?: string,
) =>
  M.setOnboardingItem(
    null,
    { checklistId, key, done, notes } as never,
    ctx,
  ) as unknown as Promise<Checklist>;

describe('progressPercent', () => {
  it('is the share of items that are done, and 100 for a checklist with no items', () => {
    expect(progressPercent([])).toBe(100);
    expect(progressPercent([{ done: true }, { done: false }])).toBe(50);
    expect(progressPercent([{ done: true }, { done: true }, { done: true }])).toBe(100);
  });
});

describe('the default template', () => {
  it('seeds once and never overwrites an edit', async () => {
    await ensureOnboardingDefaults();
    await OnboardingTemplateModel.updateOne({ name: DEFAULT_TEMPLATE_NAME }, { tasks: [] });
    await ensureOnboardingDefaults();

    const rows = await OnboardingTemplateModel.find({ name: DEFAULT_TEMPLATE_NAME }).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0].tasks).toHaveLength(0);
  });

  it('covers the laptop, the accounts, the policies, payroll, a buddy and a first 1:1', async () => {
    await ensureOnboardingDefaults();
    const seeded = await OnboardingTemplateModel.findOne({ name: DEFAULT_TEMPLATE_NAME }).lean();
    expect(seeded?.tasks.map((task) => task.key)).toEqual([
      'laptop',
      'accounts',
      'policies',
      'payroll-details',
      'buddy',
      'first-week-1-1',
    ]);
  });
});

describe('startOnboarding', () => {
  it('copies the template onto the joiner, dated from their join date, and tells them', async () => {
    const employeeId = await joiner();
    const checklist = await start(employeeId, await template());

    expect(checklist).toMatchObject({ employeeName: 'Riya Sen', templateName: 'Standard onboarding' });
    expect(checklist.items.map((item) => item.key)).toEqual(['laptop', 'policies']);
    const stored = await OnboardingChecklistModel.findById(checklist.id).lean();
    // 3 days from a 1 September join date.
    expect(stored?.items[1].dueOn.toISOString()).toBe('2026-09-04T00:00:00.000Z');
    expect(await NotificationModel.countDocuments({ employeeId, kind: 'ONBOARDING' })).toBe(1);
  });

  it('refuses a second checklist while the first is unfinished', async () => {
    const employeeId = await joiner();
    const templateId = await template();
    await start(employeeId, templateId);

    await expect(start(employeeId, templateId)).rejects.toThrow(/not finished/);
  });

  it('allows a fresh checklist once the previous one is complete', async () => {
    const employeeId = await joiner();
    const templateId = await template([
      { key: 'laptop', label: 'Issue laptop', owner: 'IT', dueDaysFromJoin: 0 },
    ]);
    const first = await start(employeeId, templateId);
    await tick(first.id, 'laptop', true, it_);

    await expect(start(employeeId, templateId)).resolves.toMatchObject({ employeeId });
  });

  it('refuses anyone who is not HR, and an employee or template that does not exist', async () => {
    const employeeId = await joiner();
    const templateId = await template();
    await expect(start(employeeId, templateId, it_)).rejects.toThrow();
    await expect(start('nobody', templateId)).rejects.toThrow(/Employee not found/);
    await expect(start(employeeId, 'no-template')).rejects.toThrow(/template not found/);
  });
});

describe('setOnboardingItem', () => {
  it('records who ticked an item, when, and any note', async () => {
    const employeeId = await joiner();
    await seedUser('it-lead@exyconn.com', 'whatever123', [ROLES.IT]);
    const itLead = await UserModel.findOne({ email: 'it-lead@exyconn.com' }).lean();
    const ctx = ctxFor(String(itLead?._id), [ROLES.IT]);

    const checklist = await start(employeeId, await template());
    const after = await tick(checklist.id, 'laptop', true, ctx, 'Serial X-9');

    const laptop = after.items.find((item) => item.key === 'laptop');
    expect(laptop).toMatchObject({ done: true, doneByName: 'it-lead', notes: 'Serial X-9' });
    const mine = (await Q.myOnboarding(
      null,
      {} as never,
      ctxFor(employeeId, [ROLES.EMPLOYEE]),
    )) as unknown as { items: Array<{ done: boolean }> };
    expect(onboardingResolvers.OnboardingChecklist.progressPercent(mine)).toBe(50);
    expect(onboardingResolvers.OnboardingChecklist.complete(mine)).toBe(false);
  });

  it('lets the employee tick their own task and refuses them anybody else’s', async () => {
    const employeeId = await joiner();
    const employee = ctxFor(employeeId, [ROLES.EMPLOYEE]);
    const checklist = await start(employeeId, await template());

    await expect(tick(checklist.id, 'policies', true, employee)).resolves.toMatchObject({
      employeeId,
    });
    await expect(tick(checklist.id, 'laptop', true, employee)).rejects.toThrow();
  });

  it('refuses a stranger even on an EMPLOYEE-owned task', async () => {
    const employeeId = await joiner();
    const other = await joiner('other@exyconn.com');
    const checklist = await start(employeeId, await template());

    await expect(
      tick(checklist.id, 'policies', true, ctxFor(other, [ROLES.EMPLOYEE])),
    ).rejects.toThrow(/only the employee/i);
  });

  it('lets the joiner’s manager act on a task that is not theirs', async () => {
    const employeeId = await joiner();
    const manager = await seedUser('manager@exyconn.com', 'whatever123', [ROLES.EMPLOYEE]);
    await UserModel.updateOne({ _id: employeeId }, { managerId: String(manager._id) });
    const checklist = await start(employeeId, await template());

    await expect(
      tick(checklist.id, 'laptop', true, ctxFor(String(manager._id), [ROLES.EMPLOYEE])),
    ).resolves.toMatchObject({ employeeId });
  });

  it('tells HR the moment the last item is done, and only once', async () => {
    const hrLead = await seedUser('hr-lead@exyconn.com', 'whatever123', [ROLES.HR]);
    const employeeId = await joiner();
    const checklist = await start(employeeId, await template());

    await tick(checklist.id, 'laptop', true, it_);
    expect(await NotificationModel.countDocuments({ employeeId: String(hrLead._id) })).toBe(0);

    await tick(checklist.id, 'policies', true, ctxFor(employeeId, [ROLES.EMPLOYEE]));
    expect(
      await NotificationModel.countDocuments({
        employeeId: String(hrLead._id),
        kind: 'ONBOARDING',
      }),
    ).toBe(1);

    // Ticking an already-done item again must not tell HR a second time.
    await tick(checklist.id, 'laptop', true, it_);
    expect(
      await NotificationModel.countDocuments({ employeeId: String(hrLead._id) }),
    ).toBe(1);
  });

  it('un-ticks an item, clearing who did it', async () => {
    const employeeId = await joiner();
    const checklist = await start(employeeId, await template());
    await tick(checklist.id, 'laptop', true, it_);
    const after = await tick(checklist.id, 'laptop', false, it_);

    expect(after.items.find((item) => item.key === 'laptop')).toMatchObject({
      done: false,
      doneByName: null,
    });
  });

  it('refuses a checklist or a task that does not exist', async () => {
    const employeeId = await joiner();
    const checklist = await start(employeeId, await template());
    await expect(tick('nope', 'laptop', true, hr)).rejects.toThrow(/checklist not found/);
    await expect(tick(checklist.id, 'nothing', true, hr)).rejects.toThrow(/task not found/);
  });
});

describe('the HR views', () => {
  it('pages the checklists and counts them by template', async () => {
    await start(await joiner(), await template());
    const page = (await Q.listOnboardingChecklistsPaged(
      null,
      { input: { page: 0, pageSize: 10 } } as never,
      hr,
    )) as unknown as { totalCount: number; rows: Checklist[] };

    expect(page.totalCount).toBe(1);
    expect(page.rows[0].employeeName).toBe('Riya Sen');
    await expect(
      Q.listOnboardingChecklistsStats(null, {} as never, hr),
    ).resolves.toMatchObject({ total: 1 });
  });

  it('gives an employee with no checklist nothing rather than an error', async () => {
    await expect(
      Q.myOnboarding(null, {} as never, ctxFor('somebody', [ROLES.EMPLOYEE])),
    ).resolves.toBeNull();
  });

  it('deletes a checklist started against the wrong person', async () => {
    const checklist = await start(await joiner(), await template());
    await expect(
      M.deleteOnboardingChecklist(null, { id: checklist.id } as never, hr),
    ).resolves.toBe(true);
    expect(await OnboardingChecklistModel.countDocuments()).toBe(0);
  });
});
