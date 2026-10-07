import express from 'express';
import request from 'supertest';
import {
  razorpayWebhookRouter,
  stripeWebhookRouter,
} from '../../../../../src/modules/clienthub/payments/webhook';
import { PaymentAttemptModel } from '../../../../../src/modules/clienthub/payments/attempt.model';
import { hmacHex } from '../../../../../src/modules/clienthub/payments/signature';
import { PaymentModel } from '../../../../../src/modules/finance/payment.model';
import { logger } from '../../../../../src/utils/logger';
import { useTestOrganization } from '../../../../helpers';
import { SECRETS, configureGateways, seedContact, seedInvoice } from './fixtures';

const organizationId = useTestOrganization();
const app = express();
app.use('/stripe', stripeWebhookRouter());
app.use('/razorpay', razorpayWebhookRouter());

let invoiceId: string;

beforeEach(async () => {
  const { clientId } = await seedContact(organizationId);
  invoiceId = String((await seedInvoice(clientId))._id);
  for (const gateway of ['STRIPE', 'RAZORPAY'] as const) {
    await PaymentAttemptModel.create({
      gateway,
      invoiceId,
      invoiceNumber: 'INV-7',
      clientId,
      contactId: 'contact-1',
      amount: 10,
      currency: 'USD',
      externalId: `${gateway.toLowerCase()}_1`,
    });
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

const statusOf = async (gateway: string) =>
  (await PaymentAttemptModel.findOne({ gateway }).lean())?.status;

function postStripe(event: unknown, secret = SECRETS.webhook) {
  const body = typeof event === 'string' ? event : JSON.stringify(event);
  const now = Math.floor(Date.now() / 1000);
  const signed = `${now}.${body}`;
  return request(app)
    .post('/stripe')
    .set('Content-Type', 'application/json')
    .set('stripe-signature', `t=${now},v1=${hmacHex(secret, signed)}`)
    .send(body);
}

function postRazorpay(event: unknown, secret = SECRETS.webhook) {
  const body = typeof event === 'string' ? event : JSON.stringify(event);
  return request(app)
    .post('/razorpay')
    .set('Content-Type', 'application/json')
    .set('x-razorpay-signature', hmacHex(secret, body))
    .send(body);
}

const stripeEvent = (type: string, session: Record<string, unknown>) => ({
  type,
  data: { object: { id: 'stripe_1', ...session } },
});

it('refuses Stripe deliveries while no Stripe account is configured', async () => {
  await postStripe(stripeEvent('checkout.session.expired', {})).expect(400);

  expect(await statusOf('STRIPE')).toBe('PENDING');
});

describe('the Stripe webhook', () => {
  beforeEach(async () => {
    await configureGateways(['STRIPE']);
  });

  it('records a paid checkout against its invoice', async () => {
    const event = stripeEvent('checkout.session.completed', {
      payment_status: 'paid',
      payment_intent: 'pi_9',
    });

    await postStripe(event).expect(200);

    expect(await statusOf('STRIPE')).toBe('PAID');
    expect(await PaymentModel.findOne({ invoiceId }).lean()).toMatchObject({
      reference: 'pi_9',
      method: 'CARD',
    });
  });

  it('records a delayed payment that succeeds later, without a payment intent', async () => {
    await postStripe(stripeEvent('checkout.session.async_payment_succeeded', {})).expect(200);

    expect((await PaymentModel.findOne({ invoiceId }).lean())?.reference).toBe('stripe_1');
  });

  it('marks an abandoned checkout expired', async () => {
    await postStripe(stripeEvent('checkout.session.expired', {})).expect(200);

    expect(await statusOf('STRIPE')).toBe('EXPIRED');
  });

  it('acknowledges unpaid and unrelated events without settling anything', async () => {
    await postStripe(
      stripeEvent('checkout.session.completed', { payment_status: 'unpaid' }),
    ).expect(200);
    await postStripe({ type: 'customer.created', data: {} }).expect(200);
    await postStripe(stripeEvent('charge.refunded', {})).expect(200);

    expect(await statusOf('STRIPE')).toBe('PENDING');
  });

  it('refuses a delivery signed with another secret, or with no body to check', async () => {
    const other = `wh_${'x'.repeat(24)}`;

    await postStripe(stripeEvent('checkout.session.expired', {}), other).expect(400);
    await request(app).post('/stripe').set('Content-Type', 'text/plain').send('x').expect(400);
    expect(await statusOf('STRIPE')).toBe('PENDING');
  });

  it('answers 500, so Stripe retries, when a signed body cannot be read', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    await postStripe('{not json').expect(500);

    expect(logged).toHaveBeenCalledWith(expect.anything(), 'Payment webhook failed');
  });
});

describe('the Razorpay webhook', () => {
  const paid = (method?: string) => ({
    event: 'payment_link.paid',
    payload: {
      payment_link: { entity: { id: 'razorpay_1' } },
      payment: method === undefined ? undefined : { entity: { id: 'pay_1', method } },
    },
  });

  it('refuses a delivery with no account configured, or with a forged signature', async () => {
    await postRazorpay(paid('card')).expect(400);
    await configureGateways(['RAZORPAY']);

    await postRazorpay(paid('card'), `wh_${'x'.repeat(24)}`).expect(400);

    expect(await statusOf('RAZORPAY')).toBe('PENDING');
  });

  it.each([
    ['card', 'CARD'],
    ['upi', 'UPI'],
    ['netbanking', 'BANK_TRANSFER'],
    ['wallet', 'OTHER'],
  ])('records a link paid by %s as %s', async (method, recorded) => {
    await configureGateways(['RAZORPAY']);

    await postRazorpay(paid(method)).expect(200);

    expect(await PaymentModel.findOne({ invoiceId }).lean()).toMatchObject({
      method: recorded,
      reference: 'pay_1',
    });
  });

  it('records a paid link that names no payment under its link id', async () => {
    await configureGateways(['RAZORPAY']);

    await postRazorpay(paid()).expect(200);

    expect(await PaymentModel.findOne({ invoiceId }).lean()).toMatchObject({
      method: 'OTHER',
      reference: 'razorpay_1',
    });
  });

  it.each(['payment_link.expired', 'payment_link.cancelled'])(
    'expires the link on %s',
    async (name) => {
      await configureGateways(['RAZORPAY']);

      await postRazorpay({ ...paid('card'), event: name }).expect(200);

      expect(await statusOf('RAZORPAY')).toBe('EXPIRED');
    },
  );

  it('acknowledges events without a link, and events it has no use for', async () => {
    await configureGateways(['RAZORPAY']);

    await postRazorpay({ event: 'payment.captured', payload: {} }).expect(200);
    await postRazorpay({ ...paid('card'), event: 'payment_link.partially_paid' }).expect(200);

    expect(await statusOf('RAZORPAY')).toBe('PENDING');
  });
});
