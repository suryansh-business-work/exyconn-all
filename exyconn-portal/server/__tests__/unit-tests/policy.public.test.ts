import {
  OrganizationModel,
  ensurePlatformOperatorOrganization,
} from '../../src/modules/organizations';
import { PolicyModel } from '../../src/modules/legal/policy.model';
import { policyResolvers } from '../../src/modules/legal';
import { invalidatePlatformOperatorCache } from '../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization, runInScope } from '../../src/lib/tenant';

type PublicResolver = (p: unknown, a: { slug?: string }) => Promise<unknown>;
const Q = policyResolvers.Query as unknown as Record<string, PublicResolver>;

const organization = (name: string, createdAt: Date) =>
  runAsPlatform(() =>
    OrganizationModel.create({ name, slug: name.toLowerCase(), currency: 'USD', createdAt }),
  );

/** One published, public policy in a company. */
const publish = (organizationId: string, slug: string) =>
  runForOrganization(organizationId, () =>
    PolicyModel.create({
      title: `${slug} policy`,
      slug,
      body: '<p>Text</p>',
      audience: 'PUBLIC',
      status: 'PUBLISHED',
      effectiveDate: new Date('2026-01-01'),
    }),
  );

/** As the website asks: signed in to no company at all. */
const asVisitor = <T>(read: () => Promise<T>): Promise<T> =>
  runInScope({ organizationId: null, platform: false }, read);

beforeEach(() => {
  invalidatePlatformOperatorCache();
});

describe('the website reading public policies', () => {
  it('lists the operator company’s public policies, and never another company’s', async () => {
    const operator = await organization('Exyconn', new Date('2024-01-01'));
    const customer = await organization('Acme', new Date('2025-01-01'));
    await ensurePlatformOperatorOrganization();
    await publish(String(operator._id), 'privacy');
    await publish(String(customer._id), 'acme-handbook');

    const listed = (await asVisitor(() => Q.publicPolicies(null, {}))) as { slug: string }[];
    expect(listed.map((policy) => policy.slug)).toEqual(['privacy']);
    expect(await asVisitor(() => Q.publicPolicy(null, { slug: 'privacy' }))).toMatchObject({
      slug: 'privacy',
    });
    expect(await asVisitor(() => Q.publicPolicy(null, { slug: 'acme-handbook' }))).toBeNull();
  });

  it('answers empty, not with an error, before any operator company exists', async () => {
    expect(await asVisitor(() => Q.publicPolicies(null, {}))).toEqual([]);
    expect(await asVisitor(() => Q.publicPolicy(null, { slug: 'privacy' }))).toBeNull();
  });
});
