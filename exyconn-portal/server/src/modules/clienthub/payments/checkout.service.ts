import { platformOperatorOrganizationId } from '../../../lib/platformAccess';
import { env } from '../../../config/env';
import { badRequest, notFound } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { withId } from '../../../utils/serialize';
import { ownInvoice } from '../clienthub.service';
import type { ClientHubContact } from '../clienthub.auth';
import { PaymentAttemptModel, type PaymentGateway } from './attempt.model';
import { activeRazorpay, activeStripe } from './gateway.service';
import { createStripeCheckout } from './stripe.client';
import { createRazorpayLink } from './razorpay.client';
import { activePayoneer, activePaypal } from './gateway.wallets.service';
import { createPaypalOrder } from './paypal.client';
import { createPayoneerList } from './payoneer.client';
import { PAYONEER_NOTIFY_PATH } from './webhook.paths';
import { settlePaypalOrder } from './webhook.wallets';
import { ClientModel } from '../../clients/clients.model';
import { companyProfile } from '../../../lib/company';

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * The gateways are Exyconn's own accounts, so only invoices Exyconn issued — the platform
 * operator's — can be paid through them. Another company's clients see no Pay button.
 */
async function payableHere(contact: ClientHubContact): Promise<boolean> {
  return (await platformOperatorOrganizationId()) === contact.organizationId;
}

/** Which gateways a client may pay with right now. */
export async function paymentOptions(contact: ClientHubContact) {
  if (!(await payableHere(contact))) {
    return { stripe: false, razorpay: false, paypal: false, payoneer: false };
  }
  const [stripe, razorpay, paypal, payoneer] = await Promise.all([
    activeStripe(),
    activeRazorpay(),
    activePaypal(),
    activePayoneer(),
  ]);
  return {
    stripe: stripe !== null,
    razorpay: razorpay !== null,
    paypal: paypal !== null,
    payoneer: payoneer !== null,
  };
}

/** Opens the gateway's hosted checkout for an invoice's whole balance and returns its address. */
export async function startPayment(
  contact: ClientHubContact,
  invoiceId: string,
  gateway: PaymentGateway,
): Promise<{ attemptId: string; url: string }> {
  if (!(await payableHere(contact))) {
    badRequest('Online payment is not available for this invoice. Please pay by bank transfer.');
  }
  const invoice = await ownInvoice(contact, invoiceId);
  const balance = round2(invoice.amount - (invoice.amountPaid ?? 0));
  if (balance <= 0) {
    badRequest(`Invoice ${invoice.number} is already paid.`);
  }
  const attempt = await PaymentAttemptModel.create({
    gateway,
    invoiceId,
    invoiceNumber: invoice.number,
    clientId: contact.clientId,
    contactId: contact.id,
    amount: balance,
    currency: invoice.currency,
  });
  const attemptId = String(attempt._id);
  const request = {
    amount: balance,
    currency: invoice.currency,
    description: `Invoice ${invoice.number}`,
    customerEmail: contact.email,
    attemptId,
    successUrl: `${env.clientHubUrl}/payments/return?attempt=${attemptId}`,
    cancelUrl: `${env.clientHubUrl}/invoices`,
  };
  try {
    const checkout = await openCheckout(gateway, request, contact.clientId);
    await PaymentAttemptModel.updateOne({ _id: attempt._id }, checkout);
    return { attemptId, url: checkout.url };
  } catch (error) {
    logger.error({ err: error, gateway }, 'Payment checkout could not be opened');
    await PaymentAttemptModel.updateOne(
      { _id: attempt._id },
      { status: 'EXPIRED', note: 'The gateway refused to open a checkout.' },
    );
    badRequest('The payment page could not be opened just now. Please try again in a minute.');
  }
}

type CheckoutRequest = Parameters<typeof createStripeCheckout>[1];
type Checkout = { externalId: string; url: string };

/**
 * The payer's country, which Payoneer's page needs (ISO 3166-1): the client's own, or the
 * company's when the client has none on file.
 */
async function payerCountry(clientId: string): Promise<string> {
  const client = await ClientModel.findById(clientId).select('country').lean();
  return client?.country || (await companyProfile()).country;
}

const OPENERS: Readonly<
  Record<PaymentGateway, (request: CheckoutRequest, clientId: string) => Promise<Checkout>>
> = {
  STRIPE: async (request) => {
    const keys = await activeStripe();
    if (!keys) badRequest('Card payment is not set up yet.');
    return createStripeCheckout(keys.secretKey, request);
  },
  RAZORPAY: async (request) => {
    const keys = await activeRazorpay();
    if (!keys) badRequest('Razorpay is not set up yet.');
    return createRazorpayLink(keys, request);
  },
  PAYPAL: async (request) => {
    const keys = await activePaypal();
    if (!keys) badRequest('PayPal is not set up yet.');
    return createPaypalOrder(keys, request);
  },
  PAYONEER: async (request, clientId) => {
    const keys = await activePayoneer();
    if (!keys) badRequest('Payoneer is not set up yet.');
    const country = await payerCountry(clientId);
    if (!country) badRequest("Add the client's country before paying with Payoneer.");
    return createPayoneerList(keys, {
      ...request,
      country,
      notificationUrl: `${env.apiPublicUrl}${PAYONEER_NOTIFY_PATH}`,
    });
  },
};

function openCheckout(gateway: PaymentGateway, request: CheckoutRequest, clientId: string) {
  return OPENERS[gateway](request, clientId);
}

/**
 * One of the contact's own attempts — the return page polls it until it is settled. A PayPal
 * order the payer has just approved is captured here, so the money moves the moment they come
 * back rather than whenever PayPal's webhook arrives (capturing twice is harmless).
 */
export async function ownAttempt(contact: ClientHubContact, id: string) {
  const attempt = await PaymentAttemptModel.findOne({ _id: id, clientId: contact.clientId }).lean();
  if (!attempt) notFound('Payment');
  if (attempt.gateway === 'PAYPAL' && attempt.status === 'PENDING' && attempt.externalId) {
    await settlePaypalOrder(attempt.externalId).catch((error: unknown) =>
      logger.warn({ err: error }, 'PayPal capture on return failed; the webhook will retry'),
    );
    const settled = await PaymentAttemptModel.findById(id).lean();
    return withId(settled ?? attempt);
  }
  return withId(attempt);
}
