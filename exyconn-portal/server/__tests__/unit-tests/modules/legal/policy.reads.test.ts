import { Types } from 'mongoose';
import { policyResolvers } from '../../../../src/modules/legal';
import { PolicyModel } from '../../../../src/modules/legal/policy.model';
import { PolicyAcknowledgementModel } from '../../../../src/modules/legal/policy-acknowledgement.model';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import type { GraphQLContext } from '../../../../src/middleware/auth';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const { Query, Mutation, Policy } = policyResolvers;

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), roles, email: 'reader@exyconn.com' },
});

const policy = (slug: string, overrides: Record<string, unknown> = {}) =>
  PolicyModel.create({
    title: slug,
    slug,
    body: '<p>Text</p>',
    audience: 'ALL_STAFF',
    status: 'PUBLISHED',
    version: 2,
    effectiveDate: new Date('2026-01-01'),
    ...overrides,
  });

const acknowledge = (row: { _id: unknown }, userId: string, version = 2, signedAt = new Date()) =>
  PolicyAcknowledgementModel.create({
    policyId: String(row._id),
    policyTitle: 'Handbook',
    version,
    userId,
    signedName: 'Reader',
    signedAt,
  });

useTestOrganization();

describe('Policy fields', () => {
  it('reads a policy written before categories existed as GENERAL', () => {
    expect(Policy.category({})).toBe('GENERAL');
    expect(Policy.category({ category: null })).toBe('GENERAL');
    expect(Policy.category({ category: 'SECURITY' })).toBe('SECURITY');
  });

  it('reads a review date sent as a string', () => {
    expect(Policy.reviewOverdue({ nextReviewOn: '2000-01-01', status: 'PUBLISHED' })).toBe(true);
  });

  it('counts signatures for a lean row that has only an _id', async () => {
    const row = await policy('handbook');
    await acknowledge(row, 'u1');
    await acknowledge(row, 'u2', 1);

    await expect(Policy.acknowledgedCount({ _id: row._id, version: 2 })).resolves.toBe(1);
  });
});

describe('myPolicy and signing in', () => {
  it('says whether the reader has signed the version in force', async () => {
    const ctx = as([ROLES.EMPLOYEE]);
    const row = await policy('handbook');
    const signedAt = new Date('2026-03-01T10:00:00Z');

    const before = await Query.myPolicy(null, { slug: 'handbook' }, ctx);
    await acknowledge(row, ctx.user?.id ?? '', 2, signedAt);
    const after = await Query.myPolicy(null, { slug: 'handbook' }, ctx);

    expect(before).toMatchObject({ slug: 'handbook', acknowledged: false, acknowledgedAt: null });
    expect(after).toMatchObject({ acknowledged: true, acknowledgedAt: signedAt });
  });

  it('does not count a signature on an earlier version', async () => {
    const ctx = as([ROLES.EMPLOYEE]);
    const row = await policy('handbook');
    await acknowledge(row, ctx.user?.id ?? '', 1);

    await expect(Query.myPolicy(null, { slug: 'handbook' }, ctx)).resolves.toMatchObject({
      acknowledged: false,
    });
  });

  it('is null for a slug the reader may not see, or that is not published', async () => {
    await policy('grievance', { audience: 'HR_ONLY' });
    await policy('draft', { status: 'DRAFT' });
    const ctx = as([ROLES.EMPLOYEE]);

    await expect(Query.myPolicy(null, { slug: 'grievance' }, ctx)).resolves.toBeNull();
    await expect(Query.myPolicy(null, { slug: 'draft' }, ctx)).resolves.toBeNull();
    await expect(
      Query.myPolicy(null, { slug: 'grievance' }, as([ROLES.LEGAL])),
    ).resolves.toMatchObject({ slug: 'grievance' });
  });

  it('needs somebody signed in', async () => {
    expect(await codeOf(Query.myPolicy(null, { slug: 'handbook' }, { user: null }))).toBe(
      'UNAUTHENTICATED',
    );
    expect(await codeOf(Query.myPolicies(null, {}, { user: null }))).toBe('UNAUTHENTICATED');
    const signing = { policyId: new Types.ObjectId().toHexString(), signedName: 'Reader' };
    expect(await codeOf(Mutation.acknowledgePolicy(null, signing, { user: null }))).toBe(
      'UNAUTHENTICATED',
    );
  });
});

describe('myPolicies', () => {
  it('shows an administrator the HR-only policies, newest effective date first', async () => {
    await policy('older', { effectiveDate: new Date('2025-01-01') });
    await policy('grievance', { audience: 'HR_ONLY', effectiveDate: new Date('2026-05-01') });

    const rows = await Query.myPolicies(null, {}, as([ROLES.ADMIN]));

    expect(rows.map((row) => row.slug)).toEqual(['grievance', 'older']);
    expect(rows[0]).toMatchObject({ acknowledged: false, acknowledgedAt: null });
  });
});

describe('policyAcknowledgements', () => {
  it('lists a policy’s signatures to Legal, latest first', async () => {
    const row = await policy('handbook');
    await acknowledge(row, 'early', 2, new Date('2026-01-02'));
    await acknowledge(row, 'late', 2, new Date('2026-04-02'));

    const rows = (await Query.policyAcknowledgements(
      null,
      { policyId: row._id.toHexString() },
      as([ROLES.LEGAL]),
    )) as Array<{ userId: string; id: string }>;

    expect(rows.map((ack) => ack.userId)).toEqual(['late', 'early']);
    expect(typeof rows[0].id).toBe('string');
  });

  it('keeps the signature list from IT and staff', async () => {
    const row = await policy('handbook');
    const ask = (roles: Role[]) =>
      codeOf(
        (async () =>
          Query.policyAcknowledgements(null, { policyId: row._id.toHexString() }, as(roles)))(),
      );

    expect(await ask([ROLES.IT])).toBe('FORBIDDEN');
    expect(await ask([ROLES.EMPLOYEE])).toBe('FORBIDDEN');
  });
});

describe('the website without an operator company', () => {
  it('has nothing to publish until an operator exists', async () => {
    invalidatePlatformOperatorCache();
    await policy('privacy-policy', { audience: 'PUBLIC' });

    await expect(Query.publicPolicies()).resolves.toEqual([]);
    await expect(Query.publicPolicy(null, { slug: 'privacy-policy' })).resolves.toBeNull();
  });
});

describe('acknowledgePolicy', () => {
  it('is NOT_FOUND for a policy that does not exist', async () => {
    const ctx = as([ROLES.EMPLOYEE]);

    expect(
      await codeOf(
        Mutation.acknowledgePolicy(
          null,
          { policyId: new Types.ObjectId().toHexString(), signedName: 'Reader' },
          ctx,
        ),
      ),
    ).toBe('NOT_FOUND');
  });

  it('records a signature with an id', async () => {
    const row = await policy('handbook');

    const record = await Mutation.acknowledgePolicy(
      null,
      { policyId: row._id.toHexString(), signedName: 'Reader' },
      as([ROLES.EMPLOYEE]),
    );

    expect(record).toMatchObject({ version: 2, signedName: 'Reader' });
    expect(typeof record.id).toBe('string');
  });
});
