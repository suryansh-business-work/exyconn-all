import { ROLES } from '../../constants/roles';
import { assertPlatformAdmin, assertRole } from '../../middleware/roleGuard';
import type { GraphQLContext } from '../../middleware/auth';
import { runForOrganization } from '../../lib/tenant';
import { badRequest } from '../../utils/errors';
import { portalOrigin } from '../../utils/portalOrigin';
import { withId, withIds } from '../../utils/serialize';
import { diffChanges, recordAudit } from '../audit/audit.service';
import { invalidatePlanAccess, planAccessFor } from './access';
import {
  availableProviders,
  cancelSubscription,
  startCheckout,
  type CheckoutInput,
} from './checkout';
import { planService, type PlanInput } from './plan.service';
import { subscriptionService } from './subscription.service';
import type { SubscriptionStatus } from './subscription.model';

/** The audit module every billing change is recorded under. */
const BILLING_MODULE = 'Billing';

/** The company an ADMIN's billing request is about; a platform administrator has none. */
function callerCompany(ctx: GraphQLContext): string {
  assertRole(ctx, [ROLES.ADMIN]);
  const organizationId = ctx.organizationId ?? null;
  if (organizationId === null) badRequest('Open a company first: billing belongs to one company.');
  return organizationId;
}

/** The overview with ids on every record, as the GraphQL types read it. */
async function overviewFor(organizationId: string) {
  const [overview, providers, plans] = await Promise.all([
    subscriptionService.overview(organizationId),
    availableProviders(),
    planService.listPublic(),
  ]);
  return {
    ...overview,
    subscription: overview.subscription ? withId(overview.subscription) : null,
    plan: overview.plan ? withId(overview.plan) : null,
    providers,
    plans: withIds(plans),
  };
}

/**
 * Plans and subscriptions. The catalogue is the platform's (SUPER_ADMIN); a company's own
 * subscription is its ADMIN's. Every change is audited — in the company it concerns.
 */
export const billingResolvers = {
  User: {
    /** Read from the person's own company, so a sign-in answer carries it before any session. */
    planRoles: async (user: { roles?: string[]; organizationId?: unknown }) => {
      if (user.roles?.includes(ROLES.SUPER_ADMIN) || !user.organizationId) {
        return null;
      }
      return (await planAccessFor(String(user.organizationId))).roles;
    },
  },
  Query: {
    billingPlans: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertPlatformAdmin(ctx);
      return withIds(await planService.list());
    },
    billingOverview: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      overviewFor(callerCompany(ctx)),
    organizationSubscription: async (
      _p: unknown,
      { organizationId }: { organizationId: string },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      const row = await runForOrganization(organizationId, () => subscriptionService.current());
      return row ? withId(row) : null;
    },
  },
  Mutation: {
    createBillingPlan: async (
      _p: unknown,
      { input }: { input: PlanInput },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      const plan = await planService.create(input);
      await recordAudit(ctx, {
        action: 'CREATE',
        module: BILLING_MODULE,
        entityId: plan._id,
        entityLabel: plan.name,
        summary: `Created plan ${plan.name}`,
      });
      return withId(plan);
    },
    updateBillingPlan: async (
      _p: unknown,
      { id, input }: { id: string; input: PlanInput },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      const { before, plan } = await planService.update(id, input);
      invalidatePlanAccess();
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: BILLING_MODULE,
        entityId: id,
        entityLabel: plan.name,
        summary: `Updated plan ${plan.name}`,
        changes: diffChanges(before, input),
      });
      return withId(plan);
    },
    deleteBillingPlan: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertPlatformAdmin(ctx);
      const plan = await planService.remove(id);
      await recordAudit(ctx, {
        action: 'DELETE',
        module: BILLING_MODULE,
        entityId: id,
        entityLabel: plan.name,
        summary: `Deleted plan ${plan.name}`,
      });
      return true;
    },
    startBillingCheckout: async (
      _p: unknown,
      { input }: { input: CheckoutInput },
      ctx: GraphQLContext,
    ) => {
      const organizationId = callerCompany(ctx);
      const url = await startCheckout(
        organizationId,
        input,
        ctx.user?.email ?? '',
        portalOrigin(ctx.origin),
      );
      await recordAudit(ctx, {
        action: 'CREATE',
        module: BILLING_MODULE,
        entityId: input.planId,
        summary: `Opened a ${input.provider} checkout for plan ${input.planId} in ${input.currency.toUpperCase()}`,
      });
      return url;
    },
    cancelBillingSubscription: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const organizationId = callerCompany(ctx);
      await cancelSubscription(organizationId);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: BILLING_MODULE,
        entityLabel: 'Subscription',
        summary: 'Cancelled the subscription',
      });
      return overviewFor(organizationId);
    },
    assignOrganizationPlan: async (
      _p: unknown,
      args: { organizationId: string; planId: string; status: SubscriptionStatus },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      const { before, plan } = await subscriptionService.assign(
        args.organizationId,
        args.planId,
        args.status,
      );
      const summary = `Placed the company on plan ${plan.name} (${args.status})`;
      const entry = {
        action: 'UPDATE' as const,
        module: BILLING_MODULE,
        entityId: args.organizationId,
        entityLabel: plan.name,
        summary,
        changes: diffChanges(before, { planKey: plan.key, status: args.status }),
      };
      // Recorded where the company's administrators read their log, and in the platform's.
      await runForOrganization(args.organizationId, () => recordAudit(ctx, entry));
      const row = await runForOrganization(args.organizationId, () =>
        subscriptionService.current(),
      );
      return withId(row ?? badRequest('The subscription could not be read back.'));
    },
  },
};
