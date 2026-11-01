import { Types } from 'mongoose';
import { resetWorkspaceStatusCache } from '../../../../src/middleware/auth';
import { resetActingOrganizationCache } from '../../../../src/middleware/actingOrganization';
import { assertRole } from '../../../../src/middleware/roleGuard';
import { runForOrganization } from '../../../../src/lib/tenant';
import { AiJobModel } from '../../../../src/modules/ai/ai.model';
import { assertWithinAiBudget } from '../../../../src/modules/ai/ai.budget';
import { invalidatePlanAccess } from '../../../../src/modules/billing/access';
import { principalForApiKey } from '../../../../src/modules/integrations/api-key.service';
import { signToken } from '../../../../src/utils/jwt';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { contextOf, requestWith, seedCompany, seedPerson } from '../../middleware/authHarness';
import { contextFor, seedPlan, seedSubscription } from './fixtures';

jest.mock('../../../../src/modules/admin/presence', () => ({
  recordActivity: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../../src/modules/auth/session.service', () => ({
  sessionIsLive: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../../../src/modules/integrations/api-key.service', () => ({
  principalForApiKey: jest.fn(),
}));

const PLAN_REFUSAL = 'Your plan does not include this module.';
const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  invalidatePlanAccess();
  resetWorkspaceStatusCache();
  resetActingOrganizationCache();
});

/** A company on a plan opening only CRM, and a person in it holding `roles`. */
async function personOnCrmPlan(roles: Role[]) {
  const org = await seedCompany('acme');
  await seedSubscription(org, await seedPlan({ modules: [ROLES.CRM] }), { status: 'ACTIVE' });
  const person = await seedPerson(org, roles);
  const token = signToken({ id: person.id, email: person.email, roles });
  return { org, request: requestWith({ headers: { authorization: `Bearer ${token}` } }) };
}

describe('buildContext narrows roles to the plan', () => {
  it('drops modules the plan leaves out but keeps ADMIN and EMPLOYEE', async () => {
    const { org, request } = await personOnCrmPlan([
      ROLES.ADMIN,
      ROLES.EMPLOYEE,
      ROLES.CRM,
      ROLES.FINANCE,
    ]);

    const { ctx } = await contextOf(request);

    expect(ctx.user?.roles).toEqual([ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.CRM]);
    expect(ctx.planRoles).toEqual([ROLES.CRM]);
    expect(ctx.organizationId).toBe(org);
  });

  it('leaves a company with no plan untouched', async () => {
    const org = await seedCompany('acme');
    const person = await seedPerson(org, [ROLES.FINANCE]);
    const token = signToken({ id: person.id, email: person.email, roles: [ROLES.FINANCE] });

    const { ctx } = await contextOf(requestWith({ headers: { authorization: `Bearer ${token}` } }));

    expect(ctx.user?.roles).toEqual([ROLES.FINANCE]);
    expect(ctx.planRoles).toBeNull();
  });

  it('never narrows a platform administrator', async () => {
    const person = await seedPerson(null, [ROLES.SUPER_ADMIN]);
    const token = signToken({ id: person.id, email: person.email, roles: [ROLES.SUPER_ADMIN] });

    const { ctx } = await contextOf(requestWith({ headers: { authorization: `Bearer ${token}` } }));

    expect(ctx.user?.roles).toEqual([ROLES.SUPER_ADMIN]);
    expect(ctx.planRoles).toBeNull();
  });

  it('narrows an API key the same way', async () => {
    const org = new Types.ObjectId().toHexString();
    await seedSubscription(org, await seedPlan({ modules: [ROLES.CRM] }), { status: 'ACTIVE' });
    jest.mocked(principalForApiKey).mockResolvedValueOnce({
      id: 'key-1',
      name: 'Zapier',
      roles: [ROLES.CRM, ROLES.HR],
      organizationId: org,
    });

    const { ctx } = await contextOf(requestWith({ headers: { 'x-api-key': 'exy_live_1' } }));

    expect(ctx.user?.roles).toEqual([ROLES.CRM]);
    expect(ctx.planRoles).toEqual([ROLES.CRM]);
  });

  it('leaves only ADMIN and EMPLOYEE once the subscription has lapsed', async () => {
    const org = await seedCompany('acme');
    await seedSubscription(org, await seedPlan({ allModules: true }), { status: 'CANCELLED' });
    const roles = [ROLES.ADMIN, ROLES.CRM];
    const person = await seedPerson(org, roles);
    const token = signToken({ id: person.id, email: person.email, roles });

    const { ctx } = await contextOf(requestWith({ headers: { authorization: `Bearer ${token}` } }));

    expect(ctx.user?.roles).toEqual([ROLES.ADMIN]);
    expect(ctx.planRoles).toEqual([]);
  });
});

describe('assertRole inside the plan', () => {
  it('stops the ADMIN superuser at a module the plan leaves out', () => {
    const ctx = contextFor([ROLES.ADMIN], 'org', [ROLES.CRM]);

    expect(() => assertRole(ctx, [ROLES.FINANCE])).toThrow(PLAN_REFUSAL);
    expect(assertRole(ctx, [ROLES.CRM]).roles).toEqual([ROLES.ADMIN]);
  });

  it('keeps ADMIN and EMPLOYEE screens open on every plan, even a lapsed one', () => {
    const ctx = contextFor([ROLES.ADMIN, ROLES.EMPLOYEE], 'org', []);

    expect(() => assertRole(ctx, [ROLES.ADMIN])).not.toThrow();
    expect(() => assertRole(ctx, [ROLES.EMPLOYEE])).not.toThrow();
    expect(() => assertRole(ctx, [ROLES.SUPER_ADMIN, ROLES.FINANCE])).not.toThrow();
  });

  it('does not limit a caller whose company has no plan', () => {
    expect(() => assertRole(contextFor([ROLES.ADMIN], 'org', null), [ROLES.FINANCE])).not.toThrow();
  });
});

describe('the plan’s AI cap', () => {
  const job = (costUsd: number) => ({
    name: 'Draft',
    model: 'gpt',
    prompt: 'Hi',
    costUsd,
    ranAt: new Date(),
  });
  const userId = new Types.ObjectId().toHexString();

  async function companyWithCap(cap: number, fields: Record<string, unknown> = {}) {
    const org = new Types.ObjectId().toHexString();
    await seedSubscription(org, await seedPlan({ aiMonthlyUsdCap: cap }), {
      status: 'ACTIVE',
      ...fields,
    });
    return org;
  }

  it('lets a run through just under the cap and stops it at the cap', async () => {
    const org = await companyWithCap(10);
    await runForOrganization(org, () => AiJobModel.create(job(9.99)));
    await expect(runForOrganization(org, () => assertWithinAiBudget(userId))).resolves.toBe(
      undefined,
    );

    await runForOrganization(org, () => AiJobModel.create(job(0.01)));

    await expect(runForOrganization(org, () => assertWithinAiBudget(userId))).rejects.toThrow(
      'Your plan includes $10.00 of AI a month and $10.00 is used.',
    );
  });

  it('counts only the company’s own spend', async () => {
    const org = await companyWithCap(10);
    await runForOrganization(new Types.ObjectId().toHexString(), () => AiJobModel.create(job(50)));

    await expect(runForOrganization(org, () => assertWithinAiBudget(userId))).resolves.toBe(
      undefined,
    );
  });

  it('pauses AI once the subscription has lapsed, even without a cap', async () => {
    const org = await companyWithCap(0, {
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() - DAY_MS),
    });

    await expect(runForOrganization(org, () => assertWithinAiBudget(userId))).rejects.toThrow(
      'Your subscription has ended, so AI is paused.',
    );
  });

  it('does not cap a plan whose cap is 0', async () => {
    const org = await companyWithCap(0);
    await runForOrganization(org, () => AiJobModel.create(job(1000)));

    await expect(runForOrganization(org, () => assertWithinAiBudget(userId))).resolves.toBe(
      undefined,
    );
  });
});
