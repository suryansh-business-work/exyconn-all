import express, { Router } from 'express';
import { organizationOf, runAsPlatform, runForOrganization } from '../../../lib/tenant';
import { logger } from '../../../utils/logger';
import { applyPayment } from '../../finance/finance.billing';
import { PaymentAttemptModel, type PaymentGateway } from './attempt.model';
import { activeRazorpay, activeStripe } from './gateway.service';
import { validStripeSignature } from './stripe.client';
import { validRazorpaySignature } from './razorpay.client';

export { STRIPE_WEBHOOK_PATH, RAZORPAY_WEBHOOK_PATH } from './webhook.paths';
const BODY_LIMIT = '1mb';

/** Who online payments are recorded under: no person is signed in when the money arrives. */
const GATEWAY_ACTOR: Record<PaymentGateway, { id: string; name: string }> = {
  STRIPE: { id: 'gateway:stripe', name: 'Stripe (client hub)' },
  RAZORPAY: { id: 'gateway:razorpay', name: 'Razorpay (client hub)' },
  PAYPAL: { id: 'gateway:paypal', name: 'PayPal (client hub)' },
  PAYONEER: { id: 'gateway:payoneer', name: 'Payoneer (client hub)' },
};

const GATEWAY_NAME: Record<PaymentGateway, string> = {
  STRIPE: 'Stripe',
  RAZORPAY: 'Razorpay',
  PAYPAL: 'PayPal',
  PAYONEER: 'Payoneer',
};

export interface Settlement {
  gateway: PaymentGateway;
  externalId: string;
  gatewayPaymentId: string;
  method: 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
}

/**
 * Records a paid checkout against its invoice, exactly once. The attempt is claimed
 * PENDING → PAID atomically before anything is written, so a gateway retrying its webhook
 * finds nothing left to do. If the receipt cannot be recorded (the invoice was settled by
 * hand meanwhile, say) the attempt goes to REVIEW for finance to reconcile — the money is
 * real either way, so the failure is kept, never dropped.
 */
export async function settle(settlement: Settlement): Promise<void> {
  const found = await runAsPlatform(() =>
    PaymentAttemptModel.findOne({
      gateway: settlement.gateway,
      externalId: settlement.externalId,
    }).lean(),
  );
  const organizationId = found ? organizationOf(found) : null;
  if (!found || !organizationId) {
    logger.warn(`${settlement.gateway} payment for unknown checkout ${settlement.externalId}`);
    return;
  }
  await runForOrganization(organizationId, async () => {
    const claimed = await PaymentAttemptModel.findOneAndUpdate(
      { _id: found._id, status: 'PENDING' },
      { status: 'PAID', paidAt: new Date(), gatewayPaymentId: settlement.gatewayPaymentId },
      { new: true },
    ).lean();
    if (!claimed) {
      return;
    }
    try {
      await applyPayment(
        {
          invoiceId: claimed.invoiceId,
          amount: claimed.amount,
          method: settlement.method,
          reference: settlement.gatewayPaymentId || settlement.externalId,
          notes: `Paid online through ${GATEWAY_NAME[settlement.gateway]} from the client hub.`,
        },
        { user: null },
        GATEWAY_ACTOR[settlement.gateway],
      );
    } catch (error) {
      logger.error({ err: error, attempt: String(claimed._id) }, 'Online payment needs review');
      await PaymentAttemptModel.updateOne(
        { _id: claimed._id },
        { status: 'REVIEW', note: error instanceof Error ? error.message : 'Not recorded' },
      );
    }
  });
}

/** A checkout the client abandoned: marked so it no longer reads as in progress. */
export async function expire(gateway: PaymentGateway, externalId: string): Promise<void> {
  await runAsPlatform(() =>
    PaymentAttemptModel.updateOne(
      { gateway, externalId, status: 'PENDING' },
      { status: 'EXPIRED' },
    ),
  );
}

interface StripeEvent {
  type?: string;
  data?: { object?: { id?: string; payment_status?: string; payment_intent?: string } };
}

async function receiveStripe(raw: Buffer, signature: string | undefined): Promise<number> {
  const keys = await activeStripe();
  if (!keys || !validStripeSignature(raw, signature, keys.webhookSecret)) {
    return 400;
  }
  const event = JSON.parse(raw.toString('utf8')) as StripeEvent;
  const session = event.data?.object;
  if (!session?.id) {
    return 200;
  }
  const paid =
    (event.type === 'checkout.session.completed' && session.payment_status === 'paid') ||
    event.type === 'checkout.session.async_payment_succeeded';
  if (paid) {
    await settle({
      gateway: 'STRIPE',
      externalId: session.id,
      gatewayPaymentId: session.payment_intent ?? '',
      method: 'CARD',
    });
  } else if (event.type === 'checkout.session.expired') {
    await expire('STRIPE', session.id);
  }
  return 200;
}

interface RazorpayEvent {
  event?: string;
  payload?: {
    payment_link?: { entity?: { id?: string } };
    payment?: { entity?: { id?: string; method?: string } };
  };
}

const RAZORPAY_METHODS: Record<string, Settlement['method']> = {
  card: 'CARD',
  upi: 'UPI',
  netbanking: 'BANK_TRANSFER',
};

async function receiveRazorpay(raw: Buffer, signature: string | undefined): Promise<number> {
  const keys = await activeRazorpay();
  if (!keys || !validRazorpaySignature(raw, signature, keys.webhookSecret)) {
    return 400;
  }
  const event = JSON.parse(raw.toString('utf8')) as RazorpayEvent;
  const linkId = event.payload?.payment_link?.entity?.id;
  if (!linkId) {
    return 200;
  }
  if (event.event === 'payment_link.paid') {
    const payment = event.payload?.payment?.entity;
    await settle({
      gateway: 'RAZORPAY',
      externalId: linkId,
      gatewayPaymentId: payment?.id ?? '',
      method: RAZORPAY_METHODS[payment?.method ?? ''] ?? 'OTHER',
    });
  } else if (event.event === 'payment_link.expired' || event.event === 'payment_link.cancelled') {
    await expire('RAZORPAY', linkId);
  }
  return 200;
}

/** One gateway's webhook: the raw body is kept, because the signature is over those bytes. */
function webhookRouter(
  receive: (raw: Buffer, signature: string | undefined) => Promise<number>,
  signatureHeader: string,
): Router {
  const router = Router();
  router.post('/', express.raw({ type: 'application/json', limit: BODY_LIMIT }), (req, res) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    receive(raw, req.get(signatureHeader))
      .then((status) => res.sendStatus(status))
      .catch((error: unknown) => {
        logger.error({ err: error }, 'Payment webhook failed');
        // A 500 makes the gateway retry, which the exactly-once claim makes safe.
        res.sendStatus(500);
      });
  });
  return router;
}

export const stripeWebhookRouter = () => webhookRouter(receiveStripe, 'stripe-signature');
export const razorpayWebhookRouter = () => webhookRouter(receiveRazorpay, 'x-razorpay-signature');
