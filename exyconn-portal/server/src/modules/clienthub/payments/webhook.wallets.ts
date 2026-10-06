import express, { Router, type Request } from 'express';
import { runAsPlatform } from '../../../lib/tenant';
import { logger } from '../../../utils/logger';
import { PaymentAttemptModel } from './attempt.model';
import { activePayoneer, activePaypal } from './gateway.wallets.service';
import { capturePaypalOrder, verifyPaypalWebhook } from './paypal.client';
import { fetchPayoneerCharge } from './payoneer.client';
import { expire, settle } from './webhook';

const BODY_LIMIT = '1mb';
/** A charge and its invoice balance may differ by rounding in the last decimal, never more. */
const AMOUNT_TOLERANCE = 0.01;

/**
 * Captures a PayPal order the payer approved and records it against its invoice, exactly once
 * (settle claims the attempt atomically). Used by the client hub's return page and the webhook.
 */
export async function settlePaypalOrder(orderId: string): Promise<void> {
  const keys = await activePaypal();
  if (!keys) {
    return;
  }
  const capture = await capturePaypalOrder(keys, orderId);
  if (capture.completed) {
    await settle({
      gateway: 'PAYPAL',
      externalId: orderId,
      gatewayPaymentId: capture.captureId,
      method: 'OTHER',
    });
  }
}

interface PaypalEvent {
  event_type?: string;
  resource?: {
    id?: string;
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}

async function receivePaypal(req: Request): Promise<number> {
  const keys = await activePaypal();
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!keys || raw === '') {
    return 400;
  }
  const event = JSON.parse(raw) as PaypalEvent;
  const genuine = await verifyPaypalWebhook(
    keys,
    keys.webhookId,
    {
      transmissionId: req.get('paypal-transmission-id'),
      transmissionTime: req.get('paypal-transmission-time'),
      transmissionSig: req.get('paypal-transmission-sig'),
      certUrl: req.get('paypal-cert-url'),
      authAlgo: req.get('paypal-auth-algo'),
    },
    event,
  );
  if (!genuine) {
    return 400;
  }
  const orderId =
    event.event_type === 'CHECKOUT.ORDER.APPROVED'
      ? event.resource?.id
      : event.resource?.supplementary_data?.related_ids?.order_id;
  if (!orderId) {
    return 200;
  }
  if (
    event.event_type === 'CHECKOUT.ORDER.VOIDED' ||
    event.event_type === 'PAYMENT.CAPTURE.DENIED'
  ) {
    await expire('PAYPAL', orderId);
    return 200;
  }
  await settlePaypalOrder(orderId);
  return 200;
}

/** What Payoneer sends to the notification URL, as query or form parameters. */
interface PayoneerNotification {
  transactionId?: string;
  longId?: string;
  statusCode?: string;
  entity?: string;
}

const PAYONEER_GIVEN_UP: ReadonlySet<string> = new Set([
  'aborted',
  'failed',
  'declined',
  'expired',
]);

/**
 * A Payoneer status notification. Not signed, so it is only a prompt: the charge is read back
 * from Payoneer, and recorded only when Payoneer itself says it was charged, for this attempt,
 * in its amount and currency.
 */
async function receivePayoneer(notification: PayoneerNotification): Promise<void> {
  const keys = await activePayoneer();
  const attemptId = notification.transactionId ?? '';
  if (!keys || !/^[a-f\d]{24}$/i.test(attemptId)) {
    return;
  }
  const attempt = await runAsPlatform(() => PaymentAttemptModel.findById(attemptId).lean());
  if (attempt?.gateway !== 'PAYONEER' || attempt.status !== 'PENDING') {
    return;
  }
  const status = (notification.statusCode ?? '').toLowerCase();
  if (notification.entity === 'payment' && status === 'charged' && notification.longId) {
    const charge = await fetchPayoneerCharge(keys, notification.longId);
    const matches =
      charge.statusCode === 'charged' &&
      charge.transactionId === attemptId &&
      charge.currency.toUpperCase() === attempt.currency.toUpperCase() &&
      Math.abs(charge.amount - attempt.amount) <= AMOUNT_TOLERANCE;
    if (!matches) {
      logger.warn({ attemptId }, 'Payoneer notification did not match the charge Payoneer reports');
      return;
    }
    await settle({
      gateway: 'PAYONEER',
      externalId: attempt.externalId,
      gatewayPaymentId: notification.longId,
      method: 'CARD',
    });
  } else if (PAYONEER_GIVEN_UP.has(status)) {
    await expire('PAYONEER', attempt.externalId);
  }
}

/** PayPal's webhook: the raw body is kept, because PayPal verifies the event exactly as sent. */
export function paypalWebhookRouter(): Router {
  const router = Router();
  router.post('/', express.raw({ type: 'application/json', limit: BODY_LIMIT }), (req, res) => {
    receivePaypal(req)
      .then((status) => res.sendStatus(status))
      .catch((error: unknown) => {
        logger.error({ err: error }, 'PayPal webhook failed');
        // A 500 makes PayPal retry, which the exactly-once claim makes safe.
        res.sendStatus(500);
      });
  });
  return router;
}

/** Payoneer's status notifications, which arrive as GET or form-encoded POST. */
export function payoneerNotifyRouter(): Router {
  const router = Router();
  const handle = (notification: PayoneerNotification, res: express.Response) => {
    receivePayoneer(notification)
      .then(() => res.sendStatus(200))
      .catch((error: unknown) => {
        logger.error({ err: error }, 'Payoneer notification failed');
        res.sendStatus(500);
      });
  };
  router.get('/', (req, res) => handle(req.query as PayoneerNotification, res));
  router.post('/', express.urlencoded({ extended: false, limit: BODY_LIMIT }), (req, res) =>
    handle({ ...(req.query as PayoneerNotification), ...(req.body as PayoneerNotification) }, res),
  );
  return router;
}
