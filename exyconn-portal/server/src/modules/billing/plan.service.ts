import { isValidObjectId } from 'mongoose';
import { ORGANIZATION_ROLES, ROLES, type Role } from '../../constants/roles';
import { runAsPlatform } from '../../lib/tenant';
import { badRequest, notFound } from '../../utils/errors';
import { isValidCurrency } from '../../utils/iso';
import { GRANDFATHERED_PLAN_KEY, PlanModel, type PlanInterval } from './plan.model';
import { SubscriptionModel } from './subscription.model';

export interface PlanPriceInput {
  currency: string;
  amount: number;
}

export interface PlanInput {
  key: string;
  name: string;
  description?: string;
  prices: PlanPriceInput[];
  interval: PlanInterval;
  trialDays: number;
  seatLimit: number;
  allModules: boolean;
  modules: Role[];
  aiMonthlyUsdCap: number;
  isPublic: boolean;
  isActive: boolean;
  sortOrder?: number;
}

/** ADMIN (to pay and manage) and EMPLOYEE (self-service) are open on every plan. */
export const ALWAYS_OPEN_ROLES: ReadonlySet<Role> = new Set([ROLES.ADMIN, ROLES.EMPLOYEE]);

/** The module roles a plan may list: every company role except the two always open. */
const PLAN_MODULE_ROLES: ReadonlySet<Role> = new Set(
  ORGANIZATION_ROLES.filter((role) => !ALWAYS_OPEN_ROLES.has(role)),
);

const KEY_PATTERN = /^[a-z\d]+(?:-[a-z\d]+)*$/;
const MAX_KEY = 40;

/** Refuses a plan that could not be sold or enforced as written. */
function validate(input: PlanInput): void {
  if (!KEY_PATTERN.test(input.key) || input.key.length > MAX_KEY) {
    badRequest('The key is lower-case letters, digits and dashes (at most 40 characters).');
  }
  if (input.name.trim() === '') badRequest('A plan needs a name.');
  const currencies = new Set<string>();
  for (const price of input.prices) {
    const currency = price.currency.toUpperCase();
    if (!isValidCurrency(currency)) badRequest(`"${price.currency}" is not an ISO 4217 currency.`);
    if (currencies.has(currency)) badRequest(`${currency} is priced twice.`);
    if (!(price.amount >= 0)) badRequest('A price cannot be negative.');
    currencies.add(currency);
  }
  if (input.trialDays < 0 || input.trialDays > 365) badRequest('A trial is 0 to 365 days.');
  if (input.seatLimit < 0 || !Number.isInteger(input.seatLimit)) {
    badRequest('Seats are a whole number; 0 means unlimited.');
  }
  if (input.aiMonthlyUsdCap < 0) badRequest('The AI cap cannot be negative; 0 means unlimited.');
  const unknown = input.modules.filter((role) => !PLAN_MODULE_ROLES.has(role));
  if (unknown.length > 0) badRequest(`These cannot be sold as modules: ${unknown.join(', ')}.`);
}

/** The stored shape of an input: currencies upper-cased, modules unique. */
function normalized(input: PlanInput) {
  return {
    ...input,
    description: input.description ?? '',
    prices: input.prices.map((price) => ({
      currency: price.currency.toUpperCase(),
      amount: price.amount,
    })),
    modules: input.allModules ? [] : [...new Set(input.modules)],
  };
}

/**
 * The plan catalogue (platform data, managed by SUPER_ADMIN in Admin › Plans). Every read and
 * write runs as the platform: plans belong to no company.
 */
export const planService = {
  list: () => runAsPlatform(() => PlanModel.find().sort({ sortOrder: 1, createdAt: 1 }).lean()),

  /** What the sign-up page offers: active, public, and not the platform's own grandfathered plan. */
  listPublic: () =>
    runAsPlatform(() =>
      PlanModel.find({ isActive: true, isPublic: true, isSystem: false })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean(),
    ),

  async get(id: string) {
    const plan = isValidObjectId(id)
      ? await runAsPlatform(() => PlanModel.findById(id).lean())
      : null;
    if (!plan) notFound('Plan');
    return plan;
  },

  async create(input: PlanInput) {
    validate(input);
    const taken = await runAsPlatform(() => PlanModel.exists({ key: input.key }));
    if (taken) badRequest(`The key "${input.key}" is already used by another plan.`);
    const plan = await runAsPlatform(() => PlanModel.create(normalized(input)));
    return plan.toObject();
  },

  /** The key stays: subscriptions and the grandfathering migration name a plan by it. */
  async update(id: string, input: PlanInput) {
    const before = await this.get(id);
    validate({ ...input, key: before.key });
    if (before.isSystem && !input.isActive) badRequest('The grandfathered plan cannot be retired.');
    const plan = await runAsPlatform(() =>
      PlanModel.findByIdAndUpdate(
        id,
        { ...normalized(input), key: before.key },
        { new: true },
      ).lean(),
    );
    if (!plan) notFound('Plan');
    return { before, plan };
  },

  /** Only a plan nobody is on can go; retire one with subscribers instead (isActive: false). */
  async remove(id: string) {
    const plan = await this.get(id);
    if (plan.isSystem) badRequest('The grandfathered plan cannot be deleted.');
    const inUse = await runAsPlatform(() => SubscriptionModel.exists({ planId: id }));
    if (inUse)
      badRequest('Companies are on this plan. Retire it instead so nobody new can choose it.');
    await runAsPlatform(() => PlanModel.deleteOne({ _id: id }));
    return plan;
  },
};

/**
 * The plan every company that predates billing stays on: every module, no seat or AI limit, no
 * charge. Insert-only, so a SUPER_ADMIN's later edits to its name or description survive boots.
 */
export async function ensureGrandfatheredPlan() {
  return runAsPlatform(() =>
    PlanModel.findOneAndUpdate(
      { key: GRANDFATHERED_PLAN_KEY },
      {
        $setOnInsert: {
          key: GRANDFATHERED_PLAN_KEY,
          name: 'Grandfathered',
          description:
            'Every company that used the portal before plans existed. No limits, no charge.',
          prices: [],
          interval: 'YEAR',
          trialDays: 0,
          seatLimit: 0,
          allModules: true,
          modules: [],
          aiMonthlyUsdCap: 0,
          isPublic: false,
          isActive: true,
          isSystem: true,
          sortOrder: 1000,
        },
      },
      { new: true, upsert: true },
    ).lean(),
  );
}
