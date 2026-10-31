import type { Role } from '../../constants/roles';
import { runAsPlatform, runForOrganization } from '../../lib/tenant';
import { PlanModel } from './plan.model';
import { SubscriptionModel, SUBSCRIPTION_KEY, type SubscriptionStatus } from './subscription.model';

/**
 * What a company's subscription lets it do right now.
 *
 * `roles` is null when every module is open; otherwise the module roles the plan includes
 * (ADMIN and EMPLOYEE are open regardless — see plan.service). Seat and AI limits of 0 are
 * unlimited. A `lapsed` subscription (cancelled, or a trial that ran out unpaid) keeps only
 * ADMIN and EMPLOYEE open, so an administrator can still reach Admin › Billing and pay.
 */
export interface PlanAccess {
  roles: Role[] | null;
  seatLimit: number;
  aiMonthlyUsdCap: number;
  lapsed: boolean;
}

/** A company with no subscription row (made by a SUPER_ADMIN, never signed up) is not limited. */
export const UNLIMITED: PlanAccess = Object.freeze({
  roles: null,
  seatLimit: 0,
  aiMonthlyUsdCap: 0,
  lapsed: false,
});

/** How long a company's access is trusted before it is read again (same as workspace status). */
const ACCESS_TTL_MS = 60_000;
const cache = new Map<string, { at: number; access: PlanAccess }>();

/** Whether a subscription in this state no longer opens the plan's modules. */
export function isLapsed(
  status: SubscriptionStatus,
  trialEndsAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (status === 'CANCELLED') {
    return true;
  }
  return status === 'TRIALING' && trialEndsAt != null && trialEndsAt.getTime() < now.getTime();
}

/** Reads the subscription and its plan, uncached. */
async function readAccess(organizationId: string): Promise<PlanAccess> {
  const subscription = await runForOrganization(organizationId, () =>
    SubscriptionModel.findOne({ key: SUBSCRIPTION_KEY }).lean(),
  );
  if (!subscription) {
    return UNLIMITED;
  }
  const plan = await runAsPlatform(() => PlanModel.findById(subscription.planId).lean());
  if (!plan) {
    return UNLIMITED;
  }
  const lapsed = isLapsed(subscription.status, subscription.trialEndsAt);
  let roles: Role[] | null = plan.allModules ? null : (plan.modules as Role[]);
  if (lapsed) {
    roles = [];
  }
  return {
    roles,
    seatLimit: plan.seatLimit,
    aiMonthlyUsdCap: plan.aiMonthlyUsdCap,
    lapsed,
  };
}

/** A company's current access, cached for a minute. No company (the platform) is unlimited. */
export async function planAccessFor(organizationId: string | null): Promise<PlanAccess> {
  if (organizationId === null) {
    return UNLIMITED;
  }
  const hit = cache.get(organizationId);
  if (hit && Date.now() - hit.at < ACCESS_TTL_MS) {
    return hit.access;
  }
  const access = await readAccess(organizationId);
  cache.set(organizationId, { at: Date.now(), access });
  return access;
}

/** Call after a subscription or plan changes so this process enforces it at once. */
export function invalidatePlanAccess(organizationId?: string): void {
  if (organizationId === undefined) {
    cache.clear();
  } else {
    cache.delete(organizationId);
  }
}
