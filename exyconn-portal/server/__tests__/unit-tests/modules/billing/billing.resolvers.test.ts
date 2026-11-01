import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { invalidatePlanAccess } from '../../../../src/modules/billing/access';
import { billingResolvers } from '../../../../src/modules/billing/billing.resolvers';
import { PlanModel } from '../../../../src/modules/billing/plan.model';
import { SubscriptionModel } from '../../../../src/modules/billing/subscription.model';
import { configureGateways } from '../clienthub/payments/fixtures';
import {
  contextFor,
  newOrganizationId,
  planInput,
  seedPlan,
  seedSubscription,
  subscriptionOf,
} from './fixtures';

const { Query, Mutation, User } = billingResolvers;
const organizationId = newOrganizationId();
const platform = contextFor(['SUPER_ADMIN'], null);
const admin = contextFor(['ADMIN'], organizationId);
const hr = contextFor(['HR'], organizationId);

/** A request from inside the company runs in its scope, as buildContext sets it. */
const inCompany = <T>(fn: () => Promise<T>) => runForOrganization(organizationId, fn);
const FORBIDDEN = 'You do not have access to this resource';
const audits = (company: string) => runForOrganization(company, () => AuditLogModel.find().lean());

beforeEach(() => {
  invalidatePlanAccess();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the plan catalogue (SUPER_ADMIN only)', () => {
  it('creates, lists, updates and deletes a plan, auditing each step', async () => {
    const created = await Mutation.createBillingPlan(null, { input: planInput() }, platform);
    expect(created).toMatchObject({ key: 'growth', id: expect.any(String) });

    const listed = await Query.billingPlans(null, null, platform);
    expect(listed.map((plan) => plan.id)).toEqual([created.id]);

    const updated = await Mutation.updateBillingPlan(
      null,
      { id: created.id, input: planInput({ name: 'Growth Plus' }) },
      platform,
    );
    expect(updated.name).toBe('Growth Plus');

    expect(await Mutation.deleteBillingPlan(null, { id: created.id }, platform)).toBe(true);
    expect(await runAsPlatform(() => PlanModel.countDocuments())).toBe(0);

    const summaries = (await runAsPlatform(() => AuditLogModel.find().lean())).map(
      (row) => row.summary,
    );
    expect(summaries).toEqual([
      'Created plan Growth',
      'Updated plan Growth Plus',
      'Deleted plan Growth Plus',
    ]);
  });

  it('applies a plan change to companies already on it at once', async () => {
    const plan = await seedPlan({ modules: ['CRM'] });
    await seedSubscription(organizationId, plan, { status: 'ACTIVE' });
    expect(await User.planRoles({ roles: ['ADMIN'], organizationId })).toEqual(['CRM']);

    await Mutation.updateBillingPlan(
      null,
      { id: String(plan._id), input: planInput({ modules: ['CRM', 'HR'] }) },
      platform,
    );

    expect(await User.planRoles({ roles: ['ADMIN'], organizationId })).toEqual(['CRM', 'HR']);
  });

  it.each([
    ['a company ADMIN', admin],
    ['a module user', hr],
  ])('refuses %s every catalogue operation', async (_label, ctx) => {
    const plan = await seedPlan();
    const id = String(plan._id);

    await expect(Query.billingPlans(null, null, ctx)).rejects.toThrow(FORBIDDEN);
    await expect(Mutation.createBillingPlan(null, { input: planInput() }, ctx)).rejects.toThrow(
      FORBIDDEN,
    );
    await expect(
      Mutation.updateBillingPlan(null, { id, input: planInput({ name: 'Hijacked' }) }, ctx),
    ).rejects.toThrow(FORBIDDEN);
    await expect(Mutation.deleteBillingPlan(null, { id }, ctx)).rejects.toThrow(FORBIDDEN);
    await expect(Query.organizationSubscription(null, { organizationId }, ctx)).rejects.toThrow(
      FORBIDDEN,
    );
    await expect(
      Mutation.assignOrganizationPlan(null, { organizationId, planId: id, status: 'ACTIVE' }, ctx),
    ).rejects.toThrow(FORBIDDEN);
    expect((await runAsPlatform(() => PlanModel.findById(id).lean()))?.name).toBe('Growth');
    expect(await subscriptionOf(organizationId)).toBeNull();
  });

  it('refuses a caller who is not signed in', async () => {
    await expect(Query.billingPlans(null, null, { user: null })).rejects.toThrow(
      'Authentication required',
    );
  });
});

describe('a company’s subscription, as the platform sees it', () => {
  it('reads it, and reports a company with none as null', async () => {
    expect(await Query.organizationSubscription(null, { organizationId }, platform)).toBeNull();
    await seedSubscription(organizationId, await seedPlan(), { status: 'ACTIVE' });

    const row = await Query.organizationSubscription(null, { organizationId }, platform);

    expect(row).toMatchObject({ planKey: 'growth', status: 'ACTIVE', id: expect.any(String) });
  });

  it('places a company on a plan and audits it in that company', async () => {
    const plan = await seedPlan({ name: 'Enterprise', key: 'enterprise' });

    const row = await Mutation.assignOrganizationPlan(
      null,
      { organizationId, planId: String(plan._id), status: 'ACTIVE' },
      platform,
    );

    expect(row).toMatchObject({ planKey: 'enterprise', provider: 'MANUAL', status: 'ACTIVE' });
    const [entry] = await audits(organizationId);
    expect(entry.summary).toBe('Placed the company on plan Enterprise (ACTIVE)');
    expect(JSON.parse(entry.changes)).toMatchObject({ planKey: { to: 'enterprise' } });
  });

  it('reports a subscription that cannot be read back', async () => {
    const plan = await seedPlan();
    jest.spyOn(SubscriptionModel, 'findOne').mockReturnValue({ lean: async () => null } as never);

    await expect(
      Mutation.assignOrganizationPlan(
        null,
        { organizationId, planId: String(plan._id), status: 'ACTIVE' },
        platform,
      ),
    ).rejects.toThrow('The subscription could not be read back.');
  });
});

describe('Admin › Billing (the company’s ADMIN)', () => {
  it('shows the company’s own plan, usage, gateways and the plans it may move to', async () => {
    await configureGateways(['STRIPE']);
    const plan = await seedPlan();
    await seedPlan({ key: 'hidden', isPublic: false });
    await seedSubscription(organizationId, plan, { status: 'TRIALING' });
    await seedSubscription(newOrganizationId(), await seedPlan({ key: 'theirs' }));

    const overview = await Query.billingOverview(null, null, admin);

    expect(overview.subscription).toMatchObject({ planKey: 'growth', id: expect.any(String) });
    expect(overview.plan).toMatchObject({ key: 'growth', id: String(plan._id) });
    expect(overview.providers).toEqual(['STRIPE']);
    expect(overview.plans.map((row) => row.key)).toEqual(['growth', 'theirs']);
    expect(overview.seatsUsed).toBe(0);
  });

  it('shows a company on no plan as such', async () => {
    const overview = await Query.billingOverview(null, null, admin);

    expect(overview.subscription).toBeNull();
    expect(overview.plan).toBeNull();
  });

  it('refuses anyone below ADMIN, and a platform administrator outside a company', async () => {
    await expect(async () => Query.billingOverview(null, null, hr)).rejects.toThrow(FORBIDDEN);
    await expect(Mutation.cancelBillingSubscription(null, null, hr)).rejects.toThrow(FORBIDDEN);
    await expect(
      Mutation.startBillingCheckout(
        null,
        { input: { planId: 'x', currency: 'USD', provider: 'STRIPE' } },
        hr,
      ),
    ).rejects.toThrow(FORBIDDEN);
    await expect(async () => Query.billingOverview(null, null, platform)).rejects.toThrow(
      FORBIDDEN,
    );
    await expect(async () =>
      Query.billingOverview(null, null, contextFor(['ADMIN'], null)),
    ).rejects.toThrow('Open a company first: billing belongs to one company.');
  });

  it('opens a checkout and audits it, sending the hub as the return address for an unknown origin', async () => {
    await configureGateways(['STRIPE']);
    const plan = await seedPlan();
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 'cs_1', url: 'https://pay.test/1' })));

    const url = await inCompany(() =>
      Mutation.startBillingCheckout(
        null,
        { input: { planId: String(plan._id), currency: 'usd', provider: 'STRIPE' } },
        admin,
      ),
    );

    expect(url).toBe('https://pay.test/1');
    const body = fetchMock.mock.calls[0][1]?.body as URLSearchParams;
    expect(body.get('customer_email')).toBe('ada@acme.test');
    expect(body.get('success_url')).toMatch(/\/admin\/billing\?checkout=done$/);
    const [entry] = await audits(organizationId);
    expect(entry.summary).toBe(`Opened a STRIPE checkout for plan ${String(plan._id)} in USD`);
  });

  it('opens a checkout for a caller whose token carries no email', async () => {
    await configureGateways(['STRIPE']);
    const plan = await seedPlan();
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 'cs_1', url: 'https://pay.test/1' })));
    const keyless = { ...admin, user: { ...admin.user, email: undefined } } as never;

    await Mutation.startBillingCheckout(
      null,
      { input: { planId: String(plan._id), currency: 'USD', provider: 'STRIPE' } },
      keyless,
    );

    expect((fetchMock.mock.calls[0][1]?.body as URLSearchParams).get('customer_email')).toBe('');
  });

  it('cancels the company’s subscription and returns the new overview', async () => {
    await seedSubscription(organizationId, await seedPlan(), { status: 'TRIALING' });

    const overview = await inCompany(() => Mutation.cancelBillingSubscription(null, null, admin));

    expect(overview.subscription?.status).toBe('CANCELLED');
    expect(overview.lapsed).toBe(true);
    const [entry] = await audits(organizationId);
    expect(entry.summary).toBe('Cancelled the subscription');
  });
});

describe('User.planRoles', () => {
  it('is null for a platform administrator and for someone in no company', async () => {
    expect(await User.planRoles({ roles: ['SUPER_ADMIN'], organizationId })).toBeNull();
    expect(await User.planRoles({ roles: ['ADMIN'] })).toBeNull();
    expect(await User.planRoles({})).toBeNull();
  });

  it('is the person’s own company’s plan modules', async () => {
    await seedSubscription(organizationId, await seedPlan({ modules: ['FINANCE'] }));

    expect(await User.planRoles({ roles: ['ADMIN'], organizationId })).toEqual(['FINANCE']);
  });
});
