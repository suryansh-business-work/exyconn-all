import { currentOrganizationId } from '../../lib/tenant';
import { invalidatePlanAccess } from './access';
import { ensureGrandfatheredPlan } from './plan.service';
import { SubscriptionModel, SUBSCRIPTION_KEY } from './subscription.model';

/**
 * Puts a company that predates billing on the grandfathered plan (every module, no limits, no
 * charge), so introducing plans changes nothing for it. Runs once per company through the
 * `runOnce` ledger; insert-only, so a company that already has a subscription keeps it.
 */
export async function grandfatherOrganization(): Promise<void> {
  const plan = await ensureGrandfatheredPlan();
  await SubscriptionModel.updateOne(
    { key: SUBSCRIPTION_KEY },
    {
      $setOnInsert: {
        key: SUBSCRIPTION_KEY,
        planId: String(plan._id),
        planKey: plan.key,
        status: 'ACTIVE',
        provider: 'MANUAL',
      },
    },
    { upsert: true },
  );
  invalidatePlanAccess(currentOrganizationId() ?? undefined);
}
