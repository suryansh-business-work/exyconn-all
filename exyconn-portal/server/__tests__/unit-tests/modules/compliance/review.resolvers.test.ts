import { reviewResolvers } from '../../../../src/modules/compliance/review.resolvers';
import { ManagementReviewModel } from '../../../../src/modules/compliance/review.model';
import { complianceResolvers } from '../../../../src/modules/compliance';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

useTestOrganization();

const officer: GraphQLContext = {
  user: { id: 'u1', roles: [ROLES.COMPLIANCE], email: 'meera@exyconn.com' },
};
const employee: GraphQLContext = {
  user: { id: 'u2', roles: [ROLES.EMPLOYEE], email: 'dev@exyconn.com' },
};

const input = (over: Record<string, unknown> = {}) => ({
  title: 'Q4 management review',
  standards: ['ISO_9001', 'ISO_27001'],
  heldOn: new Date('2026-12-15T00:00:00.000Z'),
  chairName: 'Asha',
  attendees: 'The board',
  inputs: 'Audit results, objectives, open findings.',
  decisions: 'The system is suitable and effective.',
  actions: [{ description: 'Re-audit suppliers', ownerName: 'Ravi', done: false }],
  status: 'MINUTED',
  ...over,
});

const create = (ctx: GraphQLContext, over: Record<string, unknown> = {}) =>
  reviewResolvers.Mutation.createManagementReview(
    null,
    { input: input(over) } as never,
    ctx,
  ) as Promise<{ id: string; reference: string; actions: { description: string }[] }>;

describe('management reviews', () => {
  it('numbers each minute from its own series and keeps what was agreed', async () => {
    const first = await create(officer);
    const second = await create(officer, { title: 'Q1 management review', actions: [] });

    expect(first.reference).toBe('MR-0001');
    expect(second.reference).toBe('MR-0002');
    expect(first.actions.map((action) => action.description)).toEqual(['Re-audit suppliers']);
    const stored = await ManagementReviewModel.findById(first.id).lean();
    expect(stored?.chairName).toBe('Asha');
  });

  it('is refused to somebody outside compliance', async () => {
    await expect(create(employee)).rejects.toThrow();
    await expect(ManagementReviewModel.countDocuments()).resolves.toBe(0);
  });

  it('counts an action with no stated outcome as still open', () => {
    expect(
      reviewResolvers.ManagementReview.openActionCount({
        actions: [{ done: false }, { done: true }],
      }),
    ).toBe(1);
  });
});

describe('the compliance resolver map', () => {
  it('exposes every register under one Query and one Mutation', () => {
    expect(Object.keys(complianceResolvers.Query)).toEqual(
      expect.arrayContaining([
        'complianceOverview',
        'listRisks',
        'listObjectives',
        'listInternalAudits',
        'listFindings',
        'listManagementReviews',
      ]),
    );
    expect(complianceResolvers.Mutation.createManagementReview).toBe(
      reviewResolvers.Mutation.createManagementReview,
    );
    expect(complianceResolvers.Mutation).not.toHaveProperty('complianceOverview');
  });

  it('lists the reviews a compliance officer filed', async () => {
    await create(officer);

    const rows = (await complianceResolvers.Query.listManagementReviews(
      null,
      {} as never,
      officer,
    )) as Array<{ reference: string }>;

    expect(rows.map((row) => row.reference)).toEqual(['MR-0001']);
  });
});
