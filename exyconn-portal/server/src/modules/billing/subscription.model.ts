import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * TRIALING until the trial ends or the first payment lands; ACTIVE while paid; PAST_DUE when a
 * renewal failed (access continues while the provider retries); CANCELLED once it has ended.
 */
export const SUBSCRIPTION_STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Who collects the money: nobody yet, a gateway, or the platform by hand (invoice, grandfathered). */
export const BILLING_PROVIDERS = ['NONE', 'STRIPE', 'RAZORPAY', 'MANUAL'] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];

/** The one row each company has. */
export const SUBSCRIPTION_KEY = 'current';

/**
 * A company's subscription: which plan it is on and where it stands. Tenant data, one row per
 * company (`key: 'current'`, unique within the company).
 *
 * `lastEventAt` is the time of the newest provider event applied, so an event delivered late
 * (providers do not promise order) never rolls the status back.
 */
const subscriptionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: SUBSCRIPTION_KEY },
    planId: { type: String, required: true },
    planKey: { type: String, required: true },
    status: { type: String, enum: SUBSCRIPTION_STATUSES, required: true, default: 'TRIALING' },
    currency: { type: String, default: '', uppercase: true, trim: true },
    provider: { type: String, enum: BILLING_PROVIDERS, required: true, default: 'NONE' },
    externalSubscriptionId: { type: String, default: '', index: true },
    externalCustomerId: { type: String, default: '' },
    trialEndsAt: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, required: true, default: false },
    cancelledAt: { type: Date, default: null },
    lastEventAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type SubscriptionDocument = InferSchemaType<typeof subscriptionSchema>;

export const SubscriptionModel: Model<SubscriptionDocument> = model<SubscriptionDocument>(
  'BillingSubscription',
  subscriptionSchema,
);
