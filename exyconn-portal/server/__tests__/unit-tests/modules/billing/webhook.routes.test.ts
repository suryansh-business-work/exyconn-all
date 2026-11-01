import express from 'express';
import request from 'supertest';
import {
  razorpayWebhookRouter,
  stripeWebhookRouter,
} from '../../../../src/modules/clienthub/payments/webhook';
import { hmacHex } from '../../../../src/modules/clienthub/payments/signature';
import { SECRETS, configureGateways } from '../clienthub/payments/fixtures';
import { newOrganizationId, seedPlan, subscriptionOf } from './fixtures';

const app = express();
app.use('/stripe', stripeWebhookRouter());
app.use('/razorpay', razorpayWebhookRouter());

const organizationId = newOrganizationId();
let planId: string;

beforeEach(async () => {
  await configureGateways(['STRIPE', 'RAZORPAY']);
  planId = String((await seedPlan())._id);
});

function postStripe(event: unknown) {
  const body = JSON.stringify(event);
  const now = Math.floor(Date.now() / 1000);
  return request(app)
    .post('/stripe')
    .set('Content-Type', 'application/json')
    .set('stripe-signature', `t=${now},v1=${hmacHex(SECRETS.webhook, `${now}.${body}`)}`)
    .send(body);
}

function postRazorpay(event: unknown, eventId?: string) {
  const body = JSON.stringify(event);
  const req = request(app)
    .post('/razorpay')
    .set('Content-Type', 'application/json')
    .set('x-razorpay-signature', hmacHex(SECRETS.webhook, body));
  return (eventId ? req.set('x-razorpay-event-id', eventId) : req).send(body);
}

it('hands a signed Stripe subscription event to billing', async () => {
  await postStripe({
    id: 'evt_1',
    type: 'checkout.session.completed',
    created: 1_790_000_000,
    data: {
      object: {
        mode: 'subscription',
        subscription: 'sub_1',
        customer: 'cus_1',
        currency: 'usd',
        metadata: { billing: 'saas', organizationId, planId },
      },
    },
  }).expect(200);

  expect(await subscriptionOf(organizationId)).toMatchObject({
    provider: 'STRIPE',
    externalSubscriptionId: 'sub_1',
  });
});

describe('a signed Razorpay subscription event', () => {
  const activated = () => ({
    event: 'subscription.activated',
    created_at: 1_790_000_000,
    payload: {
      subscription: {
        entity: {
          id: 'sub_rp_1',
          status: 'active',
          notes: { billing: 'saas', organizationId, planId },
        },
      },
    },
  });

  it('is applied when Razorpay names the delivery', async () => {
    await postRazorpay(activated(), 'evt_rp_1').expect(200);

    expect(await subscriptionOf(organizationId)).toMatchObject({
      provider: 'RAZORPAY',
      status: 'ACTIVE',
    });
  });

  it('is refused without the delivery id, so Razorpay retries it', async () => {
    await postRazorpay(activated()).expect(400);

    expect(await subscriptionOf(organizationId)).toBeNull();
  });
});
