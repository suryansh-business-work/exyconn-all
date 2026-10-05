import { runAsPlatform } from '../../../lib/tenant';
import { badRequest, notFound } from '../../../utils/errors';
import { open, seal } from '../../../utils/secretBox';
import { secretHint } from '../../tech/tech.secrets';
import { RazorpayConfigModel, StripeConfigModel } from './gateway.model';
import { testStripeKey } from './stripe.client';
import { testRazorpayKeys } from './razorpay.client';

export interface StripeConfigInput {
  label: string;
  secretKey?: string | null;
  webhookSecret?: string | null;
  isActive: boolean;
}

export interface RazorpayConfigInput {
  label: string;
  keyId: string;
  keySecret?: string | null;
  webhookSecret?: string | null;
  isActive: boolean;
}

const filled = (value: string | null | undefined): value is string => Boolean(value?.trim());

/** A typed secret, sealed, with its hint; a blank one on an edit keeps what is stored. */
function secretFields(field: string, value: string | null | undefined, required: boolean) {
  if (!filled(value)) {
    if (required) badRequest(`${field} is required.`);
    return {};
  }
  return { [field]: seal(value.trim()), [`${field}Hint`]: secretHint(value.trim()) ?? '' };
}

/** One active gateway account of a kind at a time: activating this one deactivates the rest. */
async function soleActive(
  model: typeof StripeConfigModel | typeof RazorpayConfigModel,
  id: unknown,
) {
  await (model as typeof StripeConfigModel).updateMany({ _id: { $ne: id } }, { isActive: false });
}

/** Exyconn's Stripe and Razorpay accounts (Tech › Environment Variables). Platform-wide. */
export const gatewayService = {
  listStripe: () => runAsPlatform(() => StripeConfigModel.find().sort({ createdAt: -1 }).lean()),
  listRazorpay: () =>
    runAsPlatform(() => RazorpayConfigModel.find().sort({ createdAt: -1 }).lean()),

  createStripe: (input: StripeConfigInput) =>
    runAsPlatform(async () => {
      const doc = await StripeConfigModel.create({
        label: input.label,
        isActive: input.isActive,
        ...secretFields('secretKey', input.secretKey, true),
        ...secretFields('webhookSecret', input.webhookSecret, true),
      });
      if (doc.isActive) await soleActive(StripeConfigModel, doc._id);
      return doc.toObject();
    }),

  updateStripe: (id: string, input: StripeConfigInput) =>
    runAsPlatform(async () => {
      const doc = await StripeConfigModel.findByIdAndUpdate(
        id,
        {
          label: input.label,
          isActive: input.isActive,
          ...secretFields('secretKey', input.secretKey, false),
          ...secretFields('webhookSecret', input.webhookSecret, false),
        },
        { new: true },
      ).lean();
      if (!doc) notFound('Stripe account');
      if (doc.isActive) await soleActive(StripeConfigModel, doc._id);
      return doc;
    }),

  createRazorpay: (input: RazorpayConfigInput) =>
    runAsPlatform(async () => {
      const doc = await RazorpayConfigModel.create({
        label: input.label,
        keyId: input.keyId,
        isActive: input.isActive,
        ...secretFields('keySecret', input.keySecret, true),
        ...secretFields('webhookSecret', input.webhookSecret, true),
      });
      if (doc.isActive) await soleActive(RazorpayConfigModel, doc._id);
      return doc.toObject();
    }),

  updateRazorpay: (id: string, input: RazorpayConfigInput) =>
    runAsPlatform(async () => {
      const doc = await RazorpayConfigModel.findByIdAndUpdate(
        id,
        {
          label: input.label,
          keyId: input.keyId,
          isActive: input.isActive,
          ...secretFields('keySecret', input.keySecret, false),
          ...secretFields('webhookSecret', input.webhookSecret, false),
        },
        { new: true },
      ).lean();
      if (!doc) notFound('Razorpay account');
      if (doc.isActive) await soleActive(RazorpayConfigModel, doc._id);
      return doc;
    }),

  deleteStripe: (id: string) =>
    runAsPlatform(async () => (await StripeConfigModel.deleteOne({ _id: id })).deletedCount > 0),
  deleteRazorpay: (id: string) =>
    runAsPlatform(async () => (await RazorpayConfigModel.deleteOne({ _id: id })).deletedCount > 0),

  /** Calls the gateway with the stored key; throws its own message when it refuses. */
  testStripe: (id: string) =>
    runAsPlatform(async () => {
      const doc = await StripeConfigModel.findById(id).lean();
      if (!doc) notFound('Stripe account');
      await testStripeKey(open(doc.secretKey));
      return true;
    }),
  testRazorpay: (id: string) =>
    runAsPlatform(async () => {
      const doc = await RazorpayConfigModel.findById(id).lean();
      if (!doc) notFound('Razorpay account');
      await testRazorpayKeys({ keyId: doc.keyId, keySecret: open(doc.keySecret) });
      return true;
    }),
};

/** The active Stripe account's opened secrets, or null when none is configured. */
export async function activeStripe() {
  const doc = await runAsPlatform(() => StripeConfigModel.findOne({ isActive: true }).lean());
  return doc ? { secretKey: open(doc.secretKey), webhookSecret: open(doc.webhookSecret) } : null;
}

/** The active Razorpay account's opened secrets, or null when none is configured. */
export async function activeRazorpay() {
  const doc = await runAsPlatform(() => RazorpayConfigModel.findOne({ isActive: true }).lean());
  return doc
    ? {
        keyId: doc.keyId,
        keySecret: open(doc.keySecret),
        webhookSecret: open(doc.webhookSecret),
      }
    : null;
}
