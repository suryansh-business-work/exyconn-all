import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** How often a plan is charged. */
export const PLAN_INTERVALS = ['MONTH', 'YEAR'] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

/** The key of the plan every company that predates billing is kept on (see billing.migrate). */
export const GRANDFATHERED_PLAN_KEY = 'grandfathered';

/** One price of a plan, in one ISO 4217 currency, per interval. */
const planPriceSchema = new Schema(
  {
    currency: { type: String, required: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

/**
 * The Razorpay plan made for one of our prices. Razorpay charges subscriptions against a plan
 * object of its own, so one is created the first time a company checks out in that currency and
 * reused after; `amount` records the price it was made for, so a price change makes a new one.
 */
const razorpayPlanSchema = new Schema(
  {
    currency: { type: String, required: true, uppercase: true, trim: true },
    amount: { type: Number, required: true },
    interval: { type: String, enum: PLAN_INTERVALS, required: true },
    planId: { type: String, required: true },
  },
  { _id: false },
);

/**
 * A subscription plan companies sign up to: what it costs, what it includes and how many people
 * it seats. Platform data (PLATFORM_MODELS): the platform's own administrators (SUPER_ADMIN)
 * manage the catalogue in Admin › Plans, and every company reads the same one.
 *
 * Limits of 0 mean "no limit". `allModules` includes every portal, present and future;
 * otherwise `modules` lists the module roles the plan opens (ADMIN and EMPLOYEE are always open).
 */
const planSchema = new Schema(
  {
    /** URL-safe handle, unique across the platform. */
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    prices: { type: [planPriceSchema], default: [] },
    interval: { type: String, enum: PLAN_INTERVALS, required: true, default: 'MONTH' },
    trialDays: { type: Number, required: true, default: 14, min: 0, max: 365 },
    /** Active people a company on this plan may have; 0 is unlimited. */
    seatLimit: { type: Number, required: true, default: 0, min: 0 },
    allModules: { type: Boolean, required: true, default: false },
    modules: { type: [String], default: [] },
    /** AI spend a company on this plan may run up in a calendar month, in USD; 0 is unlimited. */
    aiMonthlyUsdCap: { type: Number, required: true, default: 0, min: 0 },
    /** Offered on the public sign-up page. */
    isPublic: { type: Boolean, required: true, default: true },
    /** A retired plan keeps its subscribers but cannot be chosen again. */
    isActive: { type: Boolean, required: true, default: true },
    /** Created by the platform itself (the grandfathered plan); never deleted. */
    isSystem: { type: Boolean, required: true, default: false },
    sortOrder: { type: Number, required: true, default: 0 },
    razorpayPlans: { type: [razorpayPlanSchema], default: [] },
  },
  { timestamps: true },
);

export type PlanDocument = InferSchemaType<typeof planSchema>;

export const PlanModel: Model<PlanDocument> = model<PlanDocument>('BillingPlan', planSchema);
