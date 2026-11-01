import { runAsPlatform, runForOrganization } from '../../lib/tenant';
import { badRequest } from '../../utils/errors';
import { activeRazorpay, activeStripe } from '../clienthub/payments/gateway.service';
import {
  cancelStripeSubscriptionAtPeriodEnd,
  createStripeSubscriptionCheckout,
} from '../clienthub/payments/stripe.client';
import {
  cancelRazorpaySubscriptionAtCycleEnd,
  createRazorpayPlan,
  createRazorpaySubscription,
} from '../clienthub/payments/razorpay.client';
import { PlanModel, type PlanDocument } from './plan.model';
import { planService } from './plan.service';
import { isFreePlan, subscriptionService } from './subscription.service';

export type CheckoutProvider = 'STRIPE' | 'RAZORPAY';

export interface CheckoutInput {
  planId: string;
  currency: string;
  provider: CheckoutProvider;
}

type StoredPlan = PlanDocument & { _id: unknown };

const DAY_MS = 24 * 60 * 60 * 1000;
/** Razorpay needs a number of charges up front: ten years of either interval. */
const RAZORPAY_TOTAL_COUNT = { MONTH: 120, YEAR: 10 } as const;

const NOT_CONFIGURED = (name: string) =>
  `${name} is not configured. A platform administrator adds it in Tech › Environment Variables.`;

/** Trial days still owed from the company's current trial, so checking out early loses none. */
async function trialDaysLeft(): Promise<number> {
  const current = await subscriptionService.current();
  if (current?.status !== 'TRIALING' || !current.trialEndsAt) {
    return 0;
  }
  return Math.max(0, Math.floor((current.trialEndsAt.getTime() - Date.now()) / DAY_MS));
}

/** The plan's price in a currency, refusing a plan that cannot be bought in it. */
function priceIn(plan: StoredPlan, currency: string): number {
  if (!plan.isActive) badRequest('This plan has been retired. Choose another.');
  if (isFreePlan(plan)) badRequest('This plan is free; it needs no checkout.');
  const price = plan.prices.find((row) => row.currency === currency.toUpperCase());
  if (!price) badRequest(`This plan is not sold in ${currency.toUpperCase()}.`);
  return price.amount;
}

/**
 * The Razorpay plan for this price, created on first use and remembered on our plan. Two
 * checkouts racing may each create one; both are valid, and the first remembered is reused.
 */
async function razorpayPlanId(
  keys: NonNullable<Awaited<ReturnType<typeof activeRazorpay>>>,
  plan: StoredPlan,
  currency: string,
  amount: number,
): Promise<string> {
  const cached = plan.razorpayPlans.find(
    (row) => row.currency === currency && row.amount === amount && row.interval === plan.interval,
  );
  if (cached) {
    return cached.planId;
  }
  const planId = await createRazorpayPlan(keys, {
    name: plan.name,
    amount,
    currency,
    period: plan.interval === 'YEAR' ? 'yearly' : 'monthly',
  });
  await runAsPlatform(() =>
    PlanModel.updateOne(
      { _id: plan._id },
      { $push: { razorpayPlans: { currency, amount, interval: plan.interval, planId } } },
    ),
  );
  return planId;
}

/**
 * Opens a hosted checkout for the company in scope to subscribe to a plan. Nothing about the
 * subscription changes here: the provider's signed webhook is what records it, once paid.
 */
export async function startCheckout(
  organizationId: string,
  input: CheckoutInput,
  customerEmail: string,
  portalUrl: string,
): Promise<string> {
  const plan = await planService.get(input.planId);
  const currency = input.currency.toUpperCase();
  const amount = priceIn(plan, currency);
  const trialDays = await runForOrganization(organizationId, trialDaysLeft);
  const returnUrl = `${portalUrl}/admin/billing`;

  if (input.provider === 'STRIPE') {
    const keys = await activeStripe();
    if (!keys) badRequest(NOT_CONFIGURED('Stripe'));
    const session = await createStripeSubscriptionCheckout(keys.secretKey, {
      planName: plan.name,
      amount,
      currency,
      interval: plan.interval === 'YEAR' ? 'year' : 'month',
      trialDays,
      customerEmail,
      organizationId,
      planId: String(plan._id),
      successUrl: `${returnUrl}?checkout=done`,
      cancelUrl: `${returnUrl}?checkout=cancelled`,
    });
    return session.url;
  }

  const keys = await activeRazorpay();
  if (!keys) badRequest(NOT_CONFIGURED('Razorpay'));
  const rpPlanId = await razorpayPlanId(keys, plan, currency, amount);
  const startAt = trialDays > 0 ? Math.floor((Date.now() + trialDays * DAY_MS) / 1000) : undefined;
  const subscription = await createRazorpaySubscription(keys, {
    planId: rpPlanId,
    totalCount: RAZORPAY_TOTAL_COUNT[plan.interval],
    startAt,
    notes: { billing: 'saas', organizationId, planId: String(plan._id) },
  });
  return subscription.url;
}

/**
 * Cancels the company's subscription. One a gateway collects ends with the period already paid
 * for (the webhook then marks it CANCELLED); one with no gateway behind it — a trial, a manual
 * plan — ends now.
 */
export async function cancelSubscription(organizationId: string): Promise<void> {
  const current = await runForOrganization(organizationId, () => subscriptionService.current());
  if (!current || current.status === 'CANCELLED') badRequest('There is no subscription to cancel.');

  if (current.provider === 'STRIPE' && current.externalSubscriptionId) {
    const keys = await activeStripe();
    if (!keys) badRequest(NOT_CONFIGURED('Stripe'));
    await cancelStripeSubscriptionAtPeriodEnd(keys.secretKey, current.externalSubscriptionId);
    await subscriptionService.markCancelAtPeriodEnd(organizationId);
    return;
  }
  if (current.provider === 'RAZORPAY' && current.externalSubscriptionId) {
    const keys = await activeRazorpay();
    if (!keys) badRequest(NOT_CONFIGURED('Razorpay'));
    await cancelRazorpaySubscriptionAtCycleEnd(keys, current.externalSubscriptionId);
    await subscriptionService.markCancelAtPeriodEnd(organizationId);
    return;
  }
  await subscriptionService.cancelNow(organizationId);
}

/** Which gateways a company can pay through right now. */
export async function availableProviders(): Promise<CheckoutProvider[]> {
  const [stripe, razorpay] = await Promise.all([activeStripe(), activeRazorpay()]);
  const providers: CheckoutProvider[] = [];
  if (stripe) providers.push('STRIPE');
  if (razorpay) providers.push('RAZORPAY');
  return providers;
}
