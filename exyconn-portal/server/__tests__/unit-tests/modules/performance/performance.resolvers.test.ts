import { Types } from 'mongoose';
import { PerformanceReviewModel } from '../../../../src/modules/performance/review.model';
import { performanceResolvers, performanceTypeDefs } from '../../../../src/modules/performance';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const R = {
  ...performanceResolvers.Query,
  ...performanceResolvers.Mutation,
} as unknown as Record<string, Resolver>;

const newId = () => new Types.ObjectId().toHexString();
const ctx = (id: string, roles: string[] = [ROLES.EMPLOYEE]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;
const anonymous = { user: null } as unknown as GraphQLContext;

const review = (employeeId: string, over: Record<string, unknown> = {}) =>
  PerformanceReviewModel.create({ employeeId, cycle: 'H1 2026', ...over });

describe('performance module', () => {
  it('ships its schema', () => {
    expect(performanceTypeDefs).toBeDefined();
  });
});

describe('submitSelfAssessment', () => {
  it("records the employee's own text and moves an open review on", async () => {
    const me = newId();
    const row = await review(me);

    const updated = (await R.submitSelfAssessment(
      null,
      { id: row._id.toHexString(), text: 'Shipped the tracker' },
      ctx(me),
    )) as { id: string; status: string; selfAssessment: string };

    expect(updated).toMatchObject({
      id: row._id.toHexString(),
      status: 'SELF_SUBMITTED',
      selfAssessment: 'Shipped the tracker',
    });
    expect((await PerformanceReviewModel.findById(row._id).lean())?.status).toBe('SELF_SUBMITTED');
  });

  it('refuses once the review is no longer open', async () => {
    const me = newId();
    const row = await review(me, { status: 'MANAGER_SUBMITTED', selfAssessment: 'Kept' });

    await expect(
      R.submitSelfAssessment(null, { id: row._id.toHexString(), text: 'Late edit' }, ctx(me)),
    ).rejects.toThrow(/no longer open/);
    expect((await PerformanceReviewModel.findById(row._id).lean())?.selfAssessment).toBe('Kept');
  });

  it("will not touch somebody else's review", async () => {
    const row = await review(newId());

    expect(
      await codeOf(
        R.submitSelfAssessment(null, { id: row._id.toHexString(), text: 'x' }, ctx(newId())),
      ),
    ).toBe('NOT_FOUND');
  });

  it('needs a signed-in caller', async () => {
    const row = await review(newId());

    expect(
      await codeOf(
        R.submitSelfAssessment(null, { id: row._id.toHexString(), text: 'x' }, anonymous),
      ),
    ).toBe('UNAUTHENTICATED');
  });
});

describe('submitManagerAssessment', () => {
  const hr = (id = newId()) => ctx(id, [ROLES.HR]);

  it('reports a review that does not exist', async () => {
    expect(
      await codeOf(R.submitManagerAssessment(null, { id: newId(), managerAssessment: 'x' }, hr())),
    ).toBe('NOT_FOUND');
  });

  it('refuses HR assessing their own appraisal', async () => {
    const me = newId();
    const row = await review(me, { status: 'SELF_SUBMITTED' });

    expect(
      await codeOf(
        R.submitManagerAssessment(
          null,
          { id: row._id.toHexString(), managerAssessment: 'x' },
          hr(me),
        ),
      ),
    ).toBe('FORBIDDEN');
  });

  it.each([-1, 10.5, 11])('refuses a score of %p outside 0..10', async (score) => {
    const row = await review(newId(), { status: 'SELF_SUBMITTED' });

    await expect(
      R.submitManagerAssessment(
        null,
        { id: row._id.toHexString(), managerAssessment: 'x', score },
        hr(),
      ),
    ).rejects.toThrow('Score must be between 0 and 10');
    expect((await PerformanceReviewModel.findById(row._id).lean())?.status).toBe('SELF_SUBMITTED');
  });

  it.each([0, 10])('accepts the boundary score %p', async (score) => {
    const row = await review(newId(), { status: 'SELF_SUBMITTED' });

    const updated = (await R.submitManagerAssessment(
      null,
      { id: row._id.toHexString(), managerAssessment: 'Edge', score },
      hr(),
    )) as { score: number; status: string };

    expect(updated).toMatchObject({ score, status: 'MANAGER_SUBMITTED' });
  });

  it('keeps an existing score when none is sent, and tells the employee', async () => {
    const employee = newId();
    const row = await review(employee, { status: 'SELF_SUBMITTED', score: 4 });

    const updated = (await R.submitManagerAssessment(
      null,
      { id: row._id.toHexString(), managerAssessment: 'Steady', score: null },
      hr(),
    )) as { score: number; managerAssessment: string };

    expect(updated).toMatchObject({ score: 4, managerAssessment: 'Steady' });
    const note = await NotificationModel.findOne({ employeeId: employee }).lean();
    expect(note?.title).toBe('Manager assessment submitted: H1 2026');
  });
});

describe('employee and team reads', () => {
  it('myPerformanceReviews lists only the caller’s reviews, newest first', async () => {
    const me = newId();
    const older = await review(me, { cycle: 'H1 2025' });
    await review(me, { cycle: 'H2 2025' });
    // Mongoose stamps createdAt itself, so the older row is aged through the driver.
    await PerformanceReviewModel.collection.updateOne(
      { _id: older._id },
      { $set: { createdAt: new Date('2025-01-01') } },
    );
    await review(newId(), { cycle: 'Stranger' });

    const rows = (await R.myPerformanceReviews(null, {}, ctx(me))) as Array<{ cycle: string }>;

    expect(rows.map((row) => row.cycle)).toEqual(['H2 2025', 'H1 2025']);
  });

  it('teamPerformanceReviews is empty for somebody who manages nobody', async () => {
    await review(newId());

    await expect(R.teamPerformanceReviews(null, {}, ctx(newId()))).resolves.toEqual([]);
  });

  it('teamPerformanceReviews needs a signed-in caller', async () => {
    expect(await codeOf(R.teamPerformanceReviews(null, {}, anonymous))).toBe('UNAUTHENTICATED');
  });
});
