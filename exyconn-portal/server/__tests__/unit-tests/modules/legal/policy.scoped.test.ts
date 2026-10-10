import { Types } from 'mongoose';
import { policyResolvers } from '../../../../src/modules/legal';
import { PolicyModel } from '../../../../src/modules/legal/policy.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const P = { ...policyResolvers.Query, ...policyResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;

const as = (roles: Role[], email = 'staff@exyconn.com'): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), roles, email },
});
const itStaff = as([ROLES.IT], 'it@exyconn.com');
const legal = as([ROLES.LEGAL], 'legal@exyconn.com');

const policy = (slug: string, category: string, overrides: Record<string, unknown> = {}) =>
  PolicyModel.create({
    title: slug,
    slug,
    body: '<p>Text</p>',
    category,
    effectiveDate: new Date('2026-01-01'),
    ...overrides,
  });

const input = (slug: string, category: string | null) => ({
  input: {
    title: slug,
    slug,
    body: '<p>Body</p>',
    audience: 'ALL_STAFF',
    effectiveDate: new Date('2026-02-01'),
    category,
  },
});

useTestOrganization();

describe('reading the register', () => {
  beforeEach(async () => {
    await policy('byod', 'IT');
    await policy('passwords', 'SECURITY');
    await policy('grievance', 'HR');
  });

  it('lists only IT’s categories to IT, and everything to Legal', async () => {
    const forIt = (await P.listPolicies(null, {}, itStaff)) as Array<{ slug: string; id: string }>;
    const forLegal = (await P.listPolicies(null, {}, legal)) as Array<{ slug: string }>;

    expect(forIt.map((row) => row.slug).sort((a, b) => a.localeCompare(b))).toEqual([
      'byod',
      'passwords',
    ]);
    expect(typeof forIt[0].id).toBe('string');
    expect(forLegal).toHaveLength(3);
  });

  it('pages and counts within the same narrowing', async () => {
    const page = (await P.listPoliciesPaged(
      null,
      { input: { page: 0, pageSize: 25 } },
      itStaff,
    )) as {
      rows: Array<{ id: string; category: string }>;
      totalCount: number;
    };
    const stats = (await P.listPoliciesStats(null, {}, itStaff)) as {
      total: number;
      counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
    };

    expect(page.totalCount).toBe(2);
    expect(page.rows.every((row) => ['IT', 'SECURITY'].includes(row.category))).toBe(true);
    expect(stats.total).toBe(2);
    const categories = stats.counts.find((count) => count.field === 'category');
    expect(
      categories?.buckets.map((bucket) => bucket.value).sort((a, b) => a.localeCompare(b)),
    ).toEqual(['IT', 'SECURITY']);
  });

  it('opens an IT policy for IT, but not an HR one', async () => {
    const byod = await PolicyModel.findOne({ slug: 'byod' }).lean();
    const grievance = await PolicyModel.findOne({ slug: 'grievance' }).lean();

    await expect(P.getPolicy(null, { id: String(byod?._id) }, itStaff)).resolves.toMatchObject({
      slug: 'byod',
    });
    expect(await codeOf(P.getPolicy(null, { id: String(grievance?._id) }, itStaff))).toBe(
      'FORBIDDEN',
    );
  });
});

describe('writing the register', () => {
  it('lets IT create in its categories and refuses it the others', async () => {
    expect(await codeOf(P.createPolicy(null, input('leave', 'HR'), itStaff))).toBe('FORBIDDEN');
    expect(await codeOf(P.createPolicy(null, input('untitled', null), itStaff))).toBe('FORBIDDEN');

    await expect(P.createPolicy(null, input('vpn', 'IT'), itStaff)).resolves.toMatchObject({
      slug: 'vpn',
      category: 'IT',
    });
    await expect(P.createPolicy(null, input('leave', 'HR'), legal)).resolves.toMatchObject({
      slug: 'leave',
    });
  });

  it('refuses IT moving its policy out of its categories, or editing another team’s', async () => {
    const vpn = await policy('vpn', 'IT');
    const grievance = await policy('grievance', 'HR');

    expect(
      await codeOf(
        P.updatePolicy(null, { id: vpn._id.toHexString(), ...input('vpn', 'HR') }, itStaff),
      ),
    ).toBe('FORBIDDEN');
    expect(
      await codeOf(
        P.updatePolicy(
          null,
          { id: grievance._id.toHexString(), ...input('grievance', 'IT') },
          itStaff,
        ),
      ),
    ).toBe('FORBIDDEN');
    expect((await PolicyModel.findById(grievance._id).lean())?.category).toBe('HR');
  });

  it('lets IT update its own policy', async () => {
    const vpn = await policy('vpn', 'IT');

    const updated = (await P.updatePolicy(
      null,
      { id: vpn._id.toHexString(), ...input('vpn', 'SECURITY') },
      itStaff,
    )) as { category: string };

    expect(updated.category).toBe('SECURITY');
  });

  it('lets IT delete its own policy, never another team’s', async () => {
    const vpn = await policy('vpn', 'IT');
    const grievance = await policy('grievance', 'HR');

    expect(await codeOf(P.deletePolicy(null, { id: grievance._id.toHexString() }, itStaff))).toBe(
      'FORBIDDEN',
    );
    await expect(P.deletePolicy(null, { id: vpn._id.toHexString() }, itStaff)).resolves.toBe(true);
    expect(await PolicyModel.countDocuments()).toBe(1);
  });
});

describe('publishing and archiving', () => {
  it('refuses IT publishing or archiving another team’s policy', async () => {
    const grievance = await policy('grievance', 'HR');
    const id = grievance._id.toHexString();

    expect(await codeOf(P.publishPolicy(null, { id, raiseVersion: true }, itStaff))).toBe(
      'FORBIDDEN',
    );
    expect(await codeOf(P.archivePolicy(null, { id }, itStaff))).toBe('FORBIDDEN');
    expect((await PolicyModel.findById(id).lean())?.status).toBe('DRAFT');
  });

  it('is NOT_FOUND for a policy that does not exist', async () => {
    const id = new Types.ObjectId().toHexString();

    expect(await codeOf(P.publishPolicy(null, { id }, legal))).toBe('NOT_FOUND');
    expect(await codeOf(P.archivePolicy(null, { id }, legal))).toBe('NOT_FOUND');
  });

  it('names the account id as approver when the token carries no email', async () => {
    const row = await policy('handbook', 'GENERAL');
    const userId = new Types.ObjectId().toHexString();
    const noEmail = {
      user: { id: userId, roles: [ROLES.LEGAL] },
    } as unknown as GraphQLContext;

    const published = (await P.publishPolicy(null, { id: row._id.toHexString() }, noEmail)) as {
      approvedByName: string;
      updatedBy: string;
      publishedAt: Date;
    };

    expect(published).toMatchObject({ approvedByName: userId, updatedBy: userId });
    expect(published.publishedAt).toBeInstanceOf(Date);
  });

  it('raises the version of a published policy whose wording changed', async () => {
    const row = await policy('handbook', 'GENERAL', { status: 'PUBLISHED', version: 4 });

    const published = (await P.publishPolicy(
      null,
      { id: row._id.toHexString(), raiseVersion: true },
      legal,
    )) as { version: number };

    expect(published.version).toBe(5);
  });
});
