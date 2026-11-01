import { Types } from 'mongoose';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { invalidatePlanAccess } from '../../../../src/modules/billing/access';
import { PlanModel } from '../../../../src/modules/billing/plan.model';
import type { PlanInput } from '../../../../src/modules/billing/plan.service';
import {
  SubscriptionModel,
  SUBSCRIPTION_KEY,
  type SubscriptionDocument,
} from '../../../../src/modules/billing/subscription.model';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { Role } from '../../../../src/constants/roles';

/** A sellable plan as Admin › Plans sends it; each test overrides what it is about. */
export function planInput(fields: Partial<PlanInput> = {}): PlanInput {
  return {
    key: 'growth',
    name: 'Growth',
    description: 'For growing teams',
    prices: [
      { currency: 'usd', amount: 49 },
      { currency: 'INR', amount: 3999 },
    ],
    interval: 'MONTH',
    trialDays: 14,
    seatLimit: 10,
    allModules: false,
    modules: ['CRM', 'HR'],
    aiMonthlyUsdCap: 25,
    isPublic: true,
    isActive: true,
    sortOrder: 1,
    ...fields,
  };
}

/** Writes a plan straight to the catalogue (platform data). */
export async function seedPlan(fields: Record<string, unknown> = {}) {
  const plan = await runAsPlatform(() =>
    PlanModel.create({ ...planInput(), prices: [{ currency: 'USD', amount: 49 }], ...fields }),
  );
  return plan.toObject();
}

/** Writes a company's subscription row in that company's own scope. */
export async function seedSubscription(
  organizationId: string,
  plan: { _id: unknown; key: string },
  fields: Partial<SubscriptionDocument> = {},
) {
  await runForOrganization(organizationId, () =>
    SubscriptionModel.create({
      key: SUBSCRIPTION_KEY,
      planId: String(plan._id),
      planKey: plan.key,
      ...fields,
    }),
  );
  invalidatePlanAccess(organizationId);
}

/** Reads a company's subscription row back from its own scope. */
export function subscriptionOf(organizationId: string) {
  return runForOrganization(organizationId, () =>
    SubscriptionModel.findOne({ key: SUBSCRIPTION_KEY }).lean(),
  );
}

export const newOrganizationId = (): string => new Types.ObjectId().toHexString();

/** A signed-in caller's context: roles, company and (optionally) the plan's roles. */
export function contextFor(
  roles: Role[],
  organizationId: string | null,
  planRoles: Role[] | null = null,
): GraphQLContext {
  return {
    user: { id: new Types.ObjectId().toHexString(), email: 'ada@acme.test', roles, organizationId },
    organizationId,
    planRoles,
    ip: '203.0.113.7',
    origin: 'https://admin.exyconn.com',
    userAgent: 'jest',
  } as GraphQLContext;
}
