import { randomUUID } from 'node:crypto';
import { print } from 'graphql';
import { Types } from 'mongoose';
import { onboardingResolvers, onboardingTypeDefs } from '../../../../src/modules/onboarding';
import { itemsFromTemplate } from '../../../../src/modules/onboarding/onboarding.service';
import { ensureOnboardingDefaults } from '../../../../src/modules/onboarding/onboarding.defaults';
import {
  OnboardingChecklistModel,
  OnboardingTemplateModel,
} from '../../../../src/modules/onboarding/onboarding.model';
import { logger } from '../../../../src/utils/logger';
import { ROLES } from '../../../../src/constants/roles';
import { seedUser } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: never, c: GraphQLContext) => Promise<never>;
const M = onboardingResolvers.Mutation as unknown as Record<string, Resolver>;
const Q = onboardingResolvers.Query as unknown as Record<string, Resolver>;

const ctxFor = (id: string, roles: string[]): GraphQLContext =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

const hr = ctxFor('hr-user', [ROLES.HR]);
const employee = ctxFor('emp-user', [ROLES.EMPLOYEE]);
const missingId = () => new Types.ObjectId().toHexString();

interface Checklist {
  id: string;
  joinDate: Date;
  items: Array<{ key: string; done: boolean; doneByName: string | null; notes: string }>;
}

const start = (employeeId: string, templateId: string) =>
  M.startOnboarding(null, { employeeId, templateId } as never, hr) as Promise<Checklist>;

const tick = (checklistId: string, key: string, ctx: GraphQLContext, notes?: string | null) =>
  M.setOnboardingItem(
    null,
    { checklistId, key, done: true, notes } as never,
    ctx,
  ) as Promise<Checklist>;

async function seedTemplate() {
  const row = await OnboardingTemplateModel.create({
    name: 'Engineering onboarding',
    tasks: [{ key: 'laptop', label: 'Issue laptop', owner: 'IT', dueDaysFromJoin: 2 }],
  });
  return row._id.toHexString();
}

async function seedEmployeeId() {
  const user = await seedUser('joiner@exyconn.com', randomUUID(), [ROLES.EMPLOYEE]);
  return user._id.toHexString();
}

describe('itemsFromTemplate', () => {
  it('dates every task from the join date and starts it open', () => {
    const items = itemsFromTemplate(
      [{ key: 'buddy', label: 'Assign a buddy', owner: 'MANAGER', dueDaysFromJoin: 1 }],
      new Date('2026-09-01T00:00:00.000Z'),
    );

    expect(items).toEqual([
      {
        key: 'buddy',
        label: 'Assign a buddy',
        owner: 'MANAGER',
        dueOn: new Date('2026-09-02T00:00:00.000Z'),
        done: false,
        doneAt: null,
        doneByName: null,
        notes: '',
      },
    ]);
  });
});

describe('starting onboarding', () => {
  it('refuses an employee id that is well-formed but belongs to nobody', async () => {
    await expect(start(missingId(), await seedTemplate())).rejects.toThrow('Employee not found');
  });

  it('refuses a template id that is well-formed but belongs to no template', async () => {
    await expect(start(await seedEmployeeId(), missingId())).rejects.toThrow(
      'Onboarding template not found',
    );
  });

  it('dates the checklist from today for an employee with no join date', async () => {
    const before = Date.now();

    const checklist = await start(await seedEmployeeId(), await seedTemplate());

    const joined = new Date(checklist.joinDate).getTime();
    expect(joined).toBeGreaterThanOrEqual(before);
    expect(joined).toBeLessThanOrEqual(Date.now());
  });
});

describe('ticking an item', () => {
  it('refuses somebody who is not signed in', async () => {
    await expect(tick(missingId(), 'laptop', { user: null })).rejects.toThrow(
      'Authentication required',
    );
  });

  it('refuses a checklist id that is well-formed but belongs to no checklist', async () => {
    await expect(tick(missingId(), 'laptop', hr)).rejects.toThrow('Onboarding checklist not found');
  });

  it('names the ticker by email when their account cannot be found', async () => {
    const checklist = await start(await seedEmployeeId(), await seedTemplate());
    const ghostId = missingId();

    const after = await tick(checklist.id, 'laptop', ctxFor(ghostId, [ROLES.IT]));

    expect(after.items[0].doneByName).toBe(`${ghostId}@exyconn.com`);
  });

  it('keeps the existing note when the tick carries none', async () => {
    const checklist = await start(await seedEmployeeId(), await seedTemplate());
    await tick(checklist.id, 'laptop', hr, 'Serial X-9');

    const after = await tick(checklist.id, 'laptop', hr, null);

    expect(after.items[0].notes).toBe('Serial X-9');
  });

  it('refuses a person with no role on the joiner who is not their manager', async () => {
    const checklist = await start(await seedEmployeeId(), await seedTemplate());

    await expect(tick(checklist.id, 'laptop', employee)).rejects.toThrow(/Only HR/);
  });
});

describe('the HR-only views', () => {
  it('refuses the checklist grid and its stats to somebody outside HR', async () => {
    await expect(
      Q.listOnboardingChecklistsPaged(
        null,
        { input: { page: 0, pageSize: 10 } } as never,
        employee,
      ),
    ).rejects.toThrow(/access/);
    await expect(Q.listOnboardingChecklistsStats(null, {} as never, employee)).rejects.toThrow(
      /access/,
    );
  });

  it('refuses to delete a checklist that does not exist, or for somebody outside HR', async () => {
    await expect(
      M.deleteOnboardingChecklist(null, { id: missingId() } as never, hr),
    ).rejects.toThrow('Onboarding checklist not found');
    await expect(
      M.deleteOnboardingChecklist(null, { id: missingId() } as never, employee),
    ).rejects.toThrow(/access/);
    await expect(OnboardingChecklistModel.countDocuments()).resolves.toBe(0);
  });
});

describe('the field resolvers', () => {
  it('counts a template’s tasks, reading a template without any as zero', () => {
    const { taskCount } = onboardingResolvers.OnboardingTemplate;

    expect(taskCount({ tasks: [{}, {}] })).toBe(2);
    expect(taskCount({})).toBe(0);
  });

  it('reports a checklist with nothing left to do as complete', () => {
    const { complete, progressPercent } = onboardingResolvers.OnboardingChecklist;

    expect(complete({ items: [{ done: true }] })).toBe(true);
    expect(progressPercent({ items: [{ done: true }, { done: false }, { done: false }] })).toBe(33);
  });
});

describe('seeding the default template', () => {
  it('announces the seed only the first time', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);

    await ensureOnboardingDefaults();
    await ensureOnboardingDefaults();

    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith('Seeded the "Standard onboarding" onboarding template');
    info.mockRestore();
  });
});

describe('the onboarding schema', () => {
  it('declares the operations the resolvers serve', () => {
    const schema = print(onboardingTypeDefs);

    for (const operation of [...Object.keys(Q), ...Object.keys(M)]) {
      expect(schema).toContain(operation);
    }
  });
});
