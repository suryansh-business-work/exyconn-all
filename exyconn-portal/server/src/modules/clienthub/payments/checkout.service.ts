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
    return { stripe: false, razorpay: false };
  }
  const [stripe, razorpay] = await Promise.all([activeStripe(), activeRazorpay()]);
  return { stripe: stripe !== null, razorpay: razorpay !== null };
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
    const checkout = await openCheckout(gateway, request);
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

async function openCheckout(
  gateway: PaymentGateway,
  request: Parameters<typeof createStripeCheckout>[1],
) {
  if (gateway === 'STRIPE') {
    const keys = await activeStripe();
    if (!keys) badRequest('Card payment is not set up yet.');
    return createStripeCheckout(keys.secretKey, request);
  }
  const keys = await activeRazorpay();
  if (!keys) badRequest('Razorpay is not set up yet.');
  return createRazorpayLink(keys, request);
}

/** One of the contact's own attempts — the return page polls it until the webhook settles it. */
export async function ownAttempt(contact: ClientHubContact, id: string) {
  const attempt = await PaymentAttemptModel.findOne({ _id: id, clientId: contact.clientId }).lean();
  if (!attempt) notFound('Payment');
  return withId(attempt);
}
