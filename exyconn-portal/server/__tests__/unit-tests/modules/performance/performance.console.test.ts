import { Types } from 'mongoose';
import { PerformanceReviewModel } from '../../../../src/modules/performance/review.model';
import { performanceResolvers } from '../../../../src/modules/performance';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const R = performanceResolvers.Mutation as unknown as Record<string, Resolver>;

const newId = () => new Types.ObjectId().toHexString();
const ctx = (id: string, roles: string[]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

const review = (employeeId: string) =>
  PerformanceReviewModel.create({ employeeId, cycle: 'H1 2026' });

const baseInput = (employeeId: string) => ({
  employeeId,
  cycle: 'H2 2026',
  selfAssessment: '',
  managerAssessment: '',
  competencies: '',
  actionPlan: '',
  status: 'OPEN',
});

describe('the HR console may not write the caller’s own appraisal', () => {
  it('refuses creating a review for yourself but creates one for somebody else', async () => {
    const me = newId();
    const other = newId();

    expect(
      // The create guard throws synchronously, so call it inside an async function.
      await codeOf(
        (async () =>
          R.createPerformanceReview(null, { input: baseInput(me) }, ctx(me, [ROLES.HR])))(),
      ),
    ).toBe('FORBIDDEN');
    const created = (await R.createPerformanceReview(
      null,
      { input: baseInput(other) },
      ctx(me, [ROLES.HR]),
    )) as { employeeId: string };
    expect(created.employeeId).toBe(other);
  });

  it('refuses an update to a stored review of your own, whatever id the input names', async () => {
    const me = newId();
    const row = await review(me);

    expect(
      await codeOf(
        R.updatePerformanceReview(
          null,
          { id: row._id.toHexString(), input: baseInput(newId()) },
          ctx(me, [ROLES.HR]),
        ),
      ),
    ).toBe('FORBIDDEN');
  });

  it('updates somebody else’s review, and reports one that is missing', async () => {
    const hrCtx = ctx(newId(), [ROLES.HR]);
    const employee = newId();
    const row = await review(employee);

    const updated = (await R.updatePerformanceReview(
      null,
      { id: row._id.toHexString(), input: { ...baseInput(employee), rating: 'Exceeds' } },
      hrCtx,
    )) as { rating: string };
    expect(updated.rating).toBe('Exceeds');

    expect(
      await codeOf(
        R.updatePerformanceReview(null, { id: newId(), input: baseInput(employee) }, hrCtx),
      ),
    ).toBe('NOT_FOUND');
  });

  it('turns away an anonymous update before reading the stored review', async () => {
    const row = await review(newId());
    const anonymous = { user: null } as unknown as GraphQLContext;

    expect(
      await codeOf(
        R.updatePerformanceReview(
          null,
          { id: row._id.toHexString(), input: baseInput(newId()) },
          anonymous,
        ),
      ),
    ).toBe('UNAUTHENTICATED');
  });
});
