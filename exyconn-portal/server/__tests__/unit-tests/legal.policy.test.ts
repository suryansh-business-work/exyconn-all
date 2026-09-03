import { policyResolvers } from '../../src/modules/legal';
import { PolicyModel } from '../../src/modules/legal/policy.model';
import { PolicyAcknowledgementModel } from '../../src/modules/legal/policy-acknowledgement.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { hashPassword } from '../../src/utils/password';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

// The acknowledgement email goes through the template engine; there is no SMTP here.
jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const asLegal: GraphQLContext = {
  user: { id: 'legal-1', roles: [ROLES.LEGAL], email: 'legal@exyconn.com' },
};

async function makeStaff(roles: string[] = [ROLES.EMPLOYEE]) {
  const passwordHash = await hashPassword('Policies@123');
  const user = await UserModel.create({
    name: 'Asha Rao',
    email: 'asha@exyconn.com',
    passwordHash,
    roles,
  });
  const ctx: GraphQLContext = { user: { id: user.id, roles: roles as never, email: user.email } };
  return { user, ctx };
}

function seedPolicy(overrides: Record<string, unknown> = {}) {
  return PolicyModel.create({
    title: 'Code of Conduct',
    slug: 'code-of-conduct',
    body: '<p>Be decent.</p>',
    audience: 'ALL_STAFF',
    status: 'PUBLISHED',
    version: 1,
    effectiveDate: new Date('2026-01-01'),
    requiresAcknowledgement: true,
    ...overrides,
  });
}

const sign = (policyId: string, ctx: GraphQLContext, signedName = 'Asha Rao') =>
  policyResolvers.Mutation.acknowledgePolicy(null, { policyId, signedName }, ctx);

const publish = (id: string, raiseVersion?: boolean) =>
  policyResolvers.Mutation.publishPolicy(null, { id, raiseVersion }, asLegal);

describe('policy audience', () => {
  it('shows staff policies to an ordinary employee', async () => {
    await seedPolicy();
    const { ctx } = await makeStaff();

    const mine = await policyResolvers.Query.myPolicies(null, {}, ctx);
    expect(mine.map((p) => p.slug)).toEqual(['code-of-conduct']);
  });

  it('hides an HR-only policy from an ordinary employee', async () => {
    // Grievance and disciplinary procedure are about handling other people's employment.
    await seedPolicy({ slug: 'grievance', title: 'Grievance', audience: 'HR_ONLY' });
    const { ctx } = await makeStaff();

    await expect(policyResolvers.Query.myPolicies(null, {}, ctx)).resolves.toEqual([]);
  });

  it('shows an HR-only policy to HR', async () => {
    await seedPolicy({ slug: 'grievance', title: 'Grievance', audience: 'HR_ONLY' });
    const { ctx } = await makeStaff([ROLES.HR]);

    const mine = await policyResolvers.Query.myPolicies(null, {}, ctx);
    expect(mine.map((p) => p.slug)).toEqual(['grievance']);
  });

  it('never shows a draft to staff, whatever its audience', async () => {
    await seedPolicy({ status: 'DRAFT' });
    const { ctx } = await makeStaff();

    await expect(policyResolvers.Query.myPolicies(null, {}, ctx)).resolves.toEqual([]);
  });
});

describe('public policies', () => {
  it('serves a published public policy to the website', async () => {
    await seedPolicy({ slug: 'privacy-policy', title: 'Privacy', audience: 'PUBLIC' });

    const rows = await policyResolvers.Query.publicPolicies();
    expect(rows).toHaveLength(1);
    await expect(
      policyResolvers.Query.publicPolicy(null, { slug: 'privacy-policy' }),
    ).resolves.toMatchObject({ title: 'Privacy' });
  });

  it('will not serve an internal policy to the website, even by exact slug', async () => {
    // The website endpoint is unauthenticated; guessing a slug must not leak the handbook.
    await seedPolicy({ slug: 'handbook', audience: 'ALL_STAFF' });

    await expect(policyResolvers.Query.publicPolicies()).resolves.toEqual([]);
    await expect(
      policyResolvers.Query.publicPolicy(null, { slug: 'handbook' }),
    ).resolves.toBeNull();
  });

  it('will not serve a draft public policy', async () => {
    await seedPolicy({ audience: 'PUBLIC', status: 'DRAFT' });
    await expect(policyResolvers.Query.publicPolicies()).resolves.toEqual([]);
  });
});

describe('acknowledging a policy', () => {
  it('records the signature against the version that was shown', async () => {
    const policy = await seedPolicy({ version: 3 });
    const { user, ctx } = await makeStaff();

    await sign(String(policy._id), ctx);

    const [record] = await PolicyAcknowledgementModel.find({ userId: user.id }).lean();
    expect(record).toMatchObject({
      version: 3,
      signedName: 'Asha Rao',
      userName: 'Asha Rao',
      userEmail: 'asha@exyconn.com',
      policyTitle: 'Code of Conduct',
    });
  });

  it('refuses a second signature on the same version', async () => {
    const policy = await seedPolicy();
    const { ctx } = await makeStaff();
    await sign(String(policy._id), ctx);

    await expect(sign(String(policy._id), ctx)).rejects.toThrow(/already signed version 1/i);
  });

  it('refuses an empty signature', async () => {
    const policy = await seedPolicy();
    const { ctx } = await makeStaff();

    await expect(sign(String(policy._id), ctx, '   ')).rejects.toThrow(/Type your name/i);
  });

  it('refuses to sign a policy this person is not meant to see', async () => {
    const policy = await seedPolicy({ audience: 'HR_ONLY' });
    const { ctx } = await makeStaff();

    await expect(sign(String(policy._id), ctx)).rejects.toThrow(/Policy/i);
  });

  it('refuses to sign a draft', async () => {
    const policy = await seedPolicy({ status: 'DRAFT' });
    const { ctx } = await makeStaff();

    await expect(sign(String(policy._id), ctx)).rejects.toThrow(/Policy/i);
  });
});

describe('publishing and versions', () => {
  it('asks everyone again when the wording changes', async () => {
    const policy = await seedPolicy();
    const { ctx } = await makeStaff();
    await sign(String(policy._id), ctx);

    await publish(String(policy._id), true);

    // The old signature is still on record, but it no longer covers what is in force.
    const [mine] = await policyResolvers.Query.myPolicies(null, {}, ctx);
    expect(mine.version).toBe(2);
    expect(mine.acknowledged).toBe(false);
    await expect(PolicyAcknowledgementModel.countDocuments()).resolves.toBe(1);
  });

  it('keeps signatures valid for a typo fix', async () => {
    const policy = await seedPolicy();
    const { ctx } = await makeStaff();
    await sign(String(policy._id), ctx);

    await publish(String(policy._id), false);

    const [mine] = await policyResolvers.Query.myPolicies(null, {}, ctx);
    expect(mine.version).toBe(1);
    expect(mine.acknowledged).toBe(true);
  });

  it('does not raise the version when publishing a draft for the first time', async () => {
    const policy = await seedPolicy({ status: 'DRAFT' });

    const published = await publish(String(policy._id), true);

    expect(published.version).toBe(1);
    expect(published.status).toBe('PUBLISHED');
  });

  it('counts signatures on the current version only', async () => {
    const policy = await seedPolicy();
    const { ctx } = await makeStaff();
    await sign(String(policy._id), ctx);

    const before = await policyResolvers.Policy.acknowledgedCount({
      id: String(policy._id),
      version: 1,
    });
    expect(before).toBe(1);

    await publish(String(policy._id), true);
    const after = await policyResolvers.Policy.acknowledgedCount({
      id: String(policy._id),
      version: 2,
    });
    expect(after).toBe(0);
  });

  it('takes an archived policy out of everyone’s list', async () => {
    const policy = await seedPolicy();
    const { ctx } = await makeStaff();

    await policyResolvers.Mutation.archivePolicy(null, { id: String(policy._id) }, asLegal);

    await expect(policyResolvers.Query.myPolicies(null, {}, ctx)).resolves.toEqual([]);
  });
});
