import { runAsPlatform } from '../../../lib/tenant';
import { badRequest, notFound } from '../../../utils/errors';
import { open, seal } from '../../../utils/secretBox';
import { secretHint } from '../../tech/tech.secrets';
import { PayoneerConfigModel, PaypalConfigModel } from './gateway.model';
import { testPaypalKeys, type PaypalKeys, type PaypalMode } from './paypal.client';
import { testPayoneerKeys, type PayoneerKeys, type PayoneerMode } from './payoneer.client';

export interface PaypalConfigInput {
  label: string;
  clientId: string;
  clientSecret?: string | null;
  webhookId: string;
  mode: PaypalMode;
  isActive: boolean;
}

export interface PayoneerConfigInput {
  label: string;
  merchantCode: string;
  apiToken?: string | null;
  division?: string | null;
  mode: PayoneerMode;
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

function paypalFields(input: PaypalConfigInput, creating: boolean) {
  return {
    label: input.label,
    clientId: input.clientId.trim(),
    webhookId: input.webhookId.trim(),
    mode: input.mode,
    isActive: input.isActive,
    ...secretFields('clientSecret', input.clientSecret, creating),
  };
}

function payoneerFields(input: PayoneerConfigInput, creating: boolean) {
  return {
    label: input.label,
    merchantCode: input.merchantCode.trim(),
    division: (input.division ?? '').trim(),
    mode: input.mode,
    isActive: input.isActive,
    ...secretFields('apiToken', input.apiToken, creating),
  };
}

/**
 * Exyconn's PayPal and Payoneer accounts (Tech › Environment Variables), alongside Stripe and
 * Razorpay in gateway.service.ts and on the same terms: platform-wide, secrets sealed and
 * write-only, one active account of each kind at a time.
 */
export const walletGatewayService = {
  listPaypal: () => runAsPlatform(() => PaypalConfigModel.find().sort({ createdAt: -1 }).lean()),
  listPayoneer: () =>
    runAsPlatform(() => PayoneerConfigModel.find().sort({ createdAt: -1 }).lean()),

  createPaypal: (input: PaypalConfigInput) =>
    runAsPlatform(async () => {
      const doc = await PaypalConfigModel.create(paypalFields(input, true));
      if (doc.isActive) {
        await PaypalConfigModel.updateMany({ _id: { $ne: doc._id } }, { isActive: false });
      }
      return doc.toObject();
    }),
  updatePaypal: (id: string, input: PaypalConfigInput) =>
    runAsPlatform(async () => {
      const doc = await PaypalConfigModel.findByIdAndUpdate(id, paypalFields(input, false), {
        new: true,
      }).lean();
      if (!doc) notFound('PayPal account');
      if (doc.isActive) {
        await PaypalConfigModel.updateMany({ _id: { $ne: doc._id } }, { isActive: false });
      }
      return doc;
    }),
  deletePaypal: (id: string) =>
    runAsPlatform(async () => (await PaypalConfigModel.deleteOne({ _id: id })).deletedCount > 0),
  testPaypal: (id: string) =>
    runAsPlatform(async () => {
      const doc = await PaypalConfigModel.findById(id).lean();
      if (!doc) notFound('PayPal account');
      await testPaypalKeys(paypalKeysOf(doc));
      return true;
    }),

  createPayoneer: (input: PayoneerConfigInput) =>
    runAsPlatform(async () => {
      const doc = await PayoneerConfigModel.create(payoneerFields(input, true));
      if (doc.isActive) {
        await PayoneerConfigModel.updateMany({ _id: { $ne: doc._id } }, { isActive: false });
      }
      return doc.toObject();
    }),
  updatePayoneer: (id: string, input: PayoneerConfigInput) =>
    runAsPlatform(async () => {
      const doc = await PayoneerConfigModel.findByIdAndUpdate(id, payoneerFields(input, false), {
        new: true,
      }).lean();
      if (!doc) notFound('Payoneer account');
      if (doc.isActive) {
        await PayoneerConfigModel.updateMany({ _id: { $ne: doc._id } }, { isActive: false });
      }
      return doc;
    }),
  deletePayoneer: (id: string) =>
    runAsPlatform(async () => (await PayoneerConfigModel.deleteOne({ _id: id })).deletedCount > 0),
  testPayoneer: (id: string) =>
    runAsPlatform(async () => {
      const doc = await PayoneerConfigModel.findById(id).lean();
      if (!doc) notFound('Payoneer account');
      await testPayoneerKeys(payoneerKeysOf(doc));
      return true;
    }),
};

function paypalKeysOf(doc: { clientId: string; clientSecret: string; mode: string }): PaypalKeys {
  return {
    clientId: doc.clientId,
    clientSecret: open(doc.clientSecret),
    mode: doc.mode as PaypalMode,
  };
}

function payoneerKeysOf(doc: {
  merchantCode: string;
  apiToken: string;
  division?: string | null;
  mode: string;
}): PayoneerKeys {
  return {
    merchantCode: doc.merchantCode,
    apiToken: open(doc.apiToken),
    division: doc.division ?? '',
    mode: doc.mode as PayoneerMode,
  };
}

/** The active PayPal account's opened keys and webhook id, or null when none is configured. */
export async function activePaypal(): Promise<(PaypalKeys & { webhookId: string }) | null> {
  const doc = await runAsPlatform(() => PaypalConfigModel.findOne({ isActive: true }).lean());
  return doc ? { ...paypalKeysOf(doc), webhookId: doc.webhookId } : null;
}

/** The active Payoneer account's opened keys, or null when none is configured. */
export async function activePayoneer(): Promise<PayoneerKeys | null> {
  const doc = await runAsPlatform(() => PayoneerConfigModel.findOne({ isActive: true }).lean());
  return doc ? payoneerKeysOf(doc) : null;
}
