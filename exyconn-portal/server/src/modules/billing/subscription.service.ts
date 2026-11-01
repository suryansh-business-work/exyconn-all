import { runAsPlatform, runForOrganization } from '../../lib/tenant';
import { AiJobModel } from '../ai/ai.model';
import { invalidatePlanAccess, isLapsed } from './access';
import { PlanModel, type PlanDocument } from './plan.model';
import { planService } from './plan.service';
import { seatsUsed } from './seats';
import {
  SubscriptionModel,
  SUBSCRIPTION_KEY,
  type BillingProvider,
  type SubscriptionStatus,
} from './subscription.model';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A plan nobody pays for (no price at all, or every price 0) needs no checkout. */
export function isFreePlan(plan: Pick<PlanDocument, 'prices'>): boolean {
  return plan.prices.every((price) => price.amount === 0);
}

/** What a provider's webhook says about a company's subscription. */
export interface ProviderUpdate {
  provider: Exclude<BillingProvider, 'NONE' | 'MANUAL'>;
  eventAt: Date;
  /** Present on the event that starts the subscription; required when no row exists yet. */
  planId?: string;
  status?: SubscriptionStatus;
  externalSubscriptionId?: string;
  externalCustomerId?: string;
  currency?: string;
  currentPeriodEnd?: Date | null;
  trialEndsAt?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

/** The fields of an update that are actually set, so an event never blanks what it did not name. */
function changedFields(update: ProviderUpdate, planKey: string | null) {
  const fields: Record<string, unknown> = {
    provider: update.provider,
    lastEventAt: update.eventAt,
  };
  const optional = [
    'status',
    'externalSubscriptionId',
    'externalCustomerId',
    'currency',
    'currentPeriodEnd',
    'trialEndsAt',
    'cancelAtPeriodEnd',
  ] as const;
  for (const field of optional) {
    if (update[field] !== undefined) fields[field] = update[field];
  }
  if (update.planId && planKey) {
    fields.planId = update.planId;
    fields.planKey = planKey;
  }
  if (update.status === 'CANCELLED') fields.cancelledAt = update.eventAt;
  return fields;
}

/** Each company's subscription. Every method runs in the company's own scope unless it says so. */
export const subscriptionService = {
  current: () => SubscriptionModel.findOne({ key: SUBSCRIPTION_KEY }).lean(),

  /**
   * Puts a company that has just signed up on a plan: a trial of the plan's length, or — for a
   * free plan — straight to ACTIVE. Insert-only: a company already subscribed keeps its row.
   */
  async startTrial(organizationId: string, plan: PlanDocument & { _id: unknown }) {
    const free = isFreePlan(plan);
    await runForOrganization(organizationId, () =>
      SubscriptionModel.updateOne(
        { key: SUBSCRIPTION_KEY },
        {
          $setOnInsert: {
            key: SUBSCRIPTION_KEY,
            planId: String(plan._id),
            planKey: plan.key,
            status: free ? 'ACTIVE' : 'TRIALING',
            provider: free ? 'MANUAL' : 'NONE',
            trialEndsAt: free ? null : new Date(Date.now() + plan.trialDays * DAY_MS),
          },
        },
        { upsert: true },
      ),
    );
    invalidatePlanAccess(organizationId);
  },

  /**
   * A platform administrator places a company on a plan by hand (an invoiced deal, a courtesy
   * extension). The provider becomes MANUAL; a gateway subscription is left to be cancelled there.
   */
  async assign(organizationId: string, planId: string, status: SubscriptionStatus) {
    const plan = await planService.get(planId);
    const before = await runForOrganization(organizationId, () => this.current());
    await runForOrganization(organizationId, () =>
      SubscriptionModel.updateOne(
        { key: SUBSCRIPTION_KEY },
        {
          $set: {
            planId: String(plan._id),
            planKey: plan.key,
            status,
            provider: 'MANUAL',
            cancelAtPeriodEnd: false,
            cancelledAt: status === 'CANCELLED' ? new Date() : null,
          },
          $setOnInsert: { key: SUBSCRIPTION_KEY },
        },
        { upsert: true },
      ),
    );
    invalidatePlanAccess(organizationId);
    return { before, plan };
  },

  /**
   * Applies a provider event, in order. A row is created only by an event that names the plan;
   * after that, an event older than the newest one applied is ignored (`lastEventAt`), so a late
   * delivery cannot roll the status back. Returns whether anything changed.
   */
  async applyProviderUpdate(organizationId: string, update: ProviderUpdate): Promise<boolean> {
    const plan = update.planId
      ? await runAsPlatform(() => PlanModel.findById(update.planId).select('key').lean())
      : null;
    return runForOrganization(organizationId, async () => {
      if (plan) {
        await SubscriptionModel.updateOne(
          { key: SUBSCRIPTION_KEY },
          { $setOnInsert: { key: SUBSCRIPTION_KEY, planId: String(plan._id), planKey: plan.key } },
          { upsert: true },
        );
      }
      const result = await SubscriptionModel.updateOne(
        {
          key: SUBSCRIPTION_KEY,
          $or: [{ lastEventAt: null }, { lastEventAt: { $lte: update.eventAt } }],
        },
        { $set: changedFields(update, plan?.key ?? null) },
      );
      invalidatePlanAccess(organizationId);
      return result.modifiedCount > 0;
    });
  },

  /** The company's subscription screen: plan, status, seats and AI used against the limits. */
  async overview(organizationId: string) {
    return runForOrganization(organizationId, async () => {
      const subscription = await this.current();
      const plan = subscription
        ? await runAsPlatform(() => PlanModel.findById(subscription.planId).lean())
        : null;
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [spent] = await AiJobModel.aggregate<{ total: number }>([
        { $match: { ranAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$costUsd' } } },
      ]);
      return {
        subscription,
        plan,
        lapsed: subscription ? isLapsed(subscription.status, subscription.trialEndsAt) : false,
        seatsUsed: await seatsUsed(),
        aiSpentThisMonthUsd: spent?.total ?? 0,
      };
    });
  },

  /** Marks a subscription with no gateway behind it as ended, now. */
  async cancelNow(organizationId: string) {
    await runForOrganization(organizationId, () =>
      SubscriptionModel.updateOne(
        { key: SUBSCRIPTION_KEY },
        { $set: { status: 'CANCELLED', cancelledAt: new Date(), cancelAtPeriodEnd: false } },
      ),
    );
    invalidatePlanAccess(organizationId);
  },

  /** A gateway subscription will end with its paid period; the webhook moves it to CANCELLED. */
  async markCancelAtPeriodEnd(organizationId: string) {
    await runForOrganization(organizationId, () =>
      SubscriptionModel.updateOne({ key: SUBSCRIPTION_KEY }, { $set: { cancelAtPeriodEnd: true } }),
    );
  },
};
