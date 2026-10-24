import { runAsPlatform } from '../../../lib/tenant';
import { badRequest, notFound } from '../../../utils/errors';
import { open, seal } from '../../../utils/secretBox';
import { BillingKeyModel, type BillingProvider } from './billing-key.model';
import { fetchOpenAiCosts, type BilledDay } from './openai.costs';

/** OpenAI's Costs API answers at most 180 daily buckets in one page. */
export const MAX_BILLING_DAYS = 180;

const HINT_LENGTH = 4;

export interface BillingKeyInput {
  provider: BillingProvider;
  label: string;
  /** Blank on an edit keeps the stored key. */
  key: string;
  isActive?: boolean | null;
}

/** A provider's real bill over a window, as the details page charts it. */
export interface ProviderBilling {
  provider: BillingProvider;
  totalUsd: number;
  days: BilledDay[];
}

const asPlatform = <T>(run: () => Promise<T>) => runAsPlatform(run);

/** Makes `id` the provider's only active key. */
async function activateOnly(provider: BillingProvider, id: string): Promise<void> {
  await asPlatform(() =>
    BillingKeyModel.updateMany({ provider, _id: { $ne: id } }, { isActive: false }),
  );
}

/** The fields to store for a key: sealed, with its hint. */
function sealedKey(key: string) {
  const plain = key.trim();
  return { key: seal(plain), keyHint: plain.slice(-HINT_LENGTH) };
}

/** The opened key of the provider's active config, or null when there is none. */
async function activeKey(provider: BillingProvider): Promise<string | null> {
  const row = await asPlatform(() =>
    BillingKeyModel.findOne({ provider, isActive: true }).select('key').lean(),
  );
  return row ? open(row.key) : null;
}

/** Reads a provider's daily bill with an opened key. */
function readBill(provider: BillingProvider, key: string, days: number): Promise<BilledDay[]> {
  switch (provider) {
    case 'OPENAI':
      return fetchOpenAiCosts(key, days);
  }
}

export const billingKeys = {
  list() {
    return asPlatform(() => BillingKeyModel.find().sort({ createdAt: -1 }).lean());
  },

  async create(input: BillingKeyInput) {
    if (!input.key.trim()) {
      badRequest('The billing key is required.');
    }
    const row = await asPlatform(() =>
      BillingKeyModel.create({
        provider: input.provider,
        label: input.label,
        isActive: Boolean(input.isActive),
        ...sealedKey(input.key),
      }),
    );
    if (row.isActive) {
      await activateOnly(input.provider, row.id);
    }
    return row.toObject();
  },

  async update(id: string, input: BillingKeyInput) {
    const changes = {
      provider: input.provider,
      label: input.label,
      isActive: Boolean(input.isActive),
      ...(input.key.trim() ? sealedKey(input.key) : {}),
    };
    const row = await asPlatform(() =>
      BillingKeyModel.findByIdAndUpdate(id, changes, { new: true }).lean(),
    );
    if (!row) notFound('Billing key');
    if (row.isActive) {
      await activateOnly(row.provider, id);
    }
    return row;
  },

  async remove(id: string) {
    const row = await asPlatform(() => BillingKeyModel.findByIdAndDelete(id).lean());
    if (!row) notFound('Billing key');
    return true;
  },

  /** Reads yesterday and today's bill with this key, so a wrong key is caught before it is used. */
  async test(id: string): Promise<string> {
    const row = await asPlatform(() => BillingKeyModel.findById(id).lean());
    if (!row) notFound('Billing key');
    const days = await readBill(row.provider, open(row.key), 2);
    const total = days.reduce((sum, day) => sum + day.amountUsd, 0);
    return `The key works: ${days.length} days of costs read, $${total.toFixed(2)} in all.`;
  },

  /** The provider's real bill over the last `days` days, or null when it has no active key. */
  async bill(provider: BillingProvider, days: number): Promise<ProviderBilling | null> {
    if (!Number.isInteger(days) || days < 1 || days > MAX_BILLING_DAYS) {
      badRequest(`Ask for 1 to ${MAX_BILLING_DAYS} days of billing.`);
    }
    const key = await activeKey(provider);
    if (key === null) {
      return null;
    }
    const billed = await readBill(provider, key, days);
    return {
      provider,
      totalUsd: billed.reduce((sum, day) => sum + day.amountUsd, 0),
      days: billed,
    };
  },
};
