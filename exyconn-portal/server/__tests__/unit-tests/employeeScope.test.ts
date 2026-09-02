import { GoalModel } from '../../src/modules/goals/goal.model';
import { EmployeeDocumentModel } from '../../src/modules/documents/document.model';
import { goalsResolvers } from '../../src/modules/goals';
import { documentsResolvers } from '../../src/modules/documents';
import { requestsResolvers } from '../../src/modules/requests';
import { EmployeeRequestModel } from '../../src/modules/requests/request.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const ctx = (id: string) =>
  ({
    user: { id, email: `${id}@exyconn.com`, roles: [ROLES.EMPLOYEE] },
  }) as unknown as GraphQLContext;

const ME = '65b000000000000000000001';
const SOMEONE_ELSE = '65b000000000000000000002';

describe('employee-scoped reads', () => {
  it('myGoals returns only the signed-in employee’s goals', async () => {
    await GoalModel.create({
      employeeId: ME,
      title: 'Mine',
      startDate: new Date(),
      endDate: new Date(),
    });
    await GoalModel.create({
      employeeId: SOMEONE_ELSE,
      title: 'Theirs',
      startDate: new Date(),
      endDate: new Date(),
    });

    const rows = (await (goalsResolvers.Query.myGoals as Resolver)(null, {}, ctx(ME))) as {
      title: string;
    }[];
    expect(rows.map((r) => r.title)).toEqual(['Mine']);
  });

  it('myDocuments never leaks another employee’s documents', async () => {
    await EmployeeDocumentModel.create({
      employeeId: SOMEONE_ELSE,
      kind: 'OFFER_LETTER',
      title: 'Their offer',
      url: 'https://example.test/a.pdf',
    });

    const rows = (await (documentsResolvers.Query.myDocuments as Resolver)(
      null,
      {},
      ctx(ME),
    )) as unknown[];
    expect(rows).toHaveLength(0);
  });
});

describe('employee-scoped writes', () => {
  it('refuses to update a goal that belongs to someone else', async () => {
    const theirs = await GoalModel.create({
      employeeId: SOMEONE_ELSE,
      title: 'Theirs',
      startDate: new Date(),
      endDate: new Date(),
    });

    await expect(
      (goalsResolvers.Mutation.updateMyGoalProgress as Resolver)(
        null,
        { id: String(theirs._id), progress: 100 },
        ctx(ME),
      ),
    ).rejects.toThrow();

    expect((await GoalModel.findById(theirs._id))?.progress).toBe(0);
  });

  it('rejects a progress value outside 0-100', async () => {
    const mine = await GoalModel.create({
      employeeId: ME,
      title: 'Mine',
      startDate: new Date(),
      endDate: new Date(),
    });
    await expect(
      (goalsResolvers.Mutation.updateMyGoalProgress as Resolver)(
        null,
        { id: String(mine._id), progress: 140 },
        ctx(ME),
      ),
    ).rejects.toThrow();
  });

  it('createMyRequest stamps the caller as owner and forces PENDING', async () => {
    await (requestsResolvers.Mutation.createMyRequest as Resolver)(
      null,
      { input: { type: 'WFH', subject: 'Work from home Friday', details: 'Plumber visit' } },
      ctx(ME),
    );

    const saved = await EmployeeRequestModel.findOne({ subject: 'Work from home Friday' });
    expect(saved?.employeeId).toBe(ME);
    expect(saved?.status).toBe('PENDING');
  });
});
