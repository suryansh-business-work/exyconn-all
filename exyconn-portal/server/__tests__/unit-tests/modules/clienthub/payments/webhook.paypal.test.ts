import express from 'express';
import request from 'supertest';
import {
  paypalWebhookRouter,
  settlePaypalOrder,
} from '../../../../../src/modules/clienthub/payments/webhook.wallets';
import { PaymentAttemptModel } from '../../../../../src/modules/clienthub/payments/attempt.model';
import {
  capturePaypalOrder,
  verifyPaypalWebhook,
} from '../../../../../src/modules/clienthub/payments/paypal.client';
import { logger } from '../../../../../src/utils/logger';
import { useTestOrganization } from '../../../../helpers';
import { configureGateways, seedContact, seedInvoice } from './fixtures';

jest.mock('../../../../../src/modules/clienthub/payments/paypal.client', () => ({
  ...jest.requireActual('../../../../../src/modules/clienthub/payments/paypal.client'),
  capturePaypalOrder: jest.fn(),
  verifyPaypalWebhook: jest.fn(),
}));

const organizationId = useTestOrganization();
const capture = jest.mocked(capturePaypalOrder);
const verify = jest.mocked(verifyPaypalWebhook);
const app = express();
app.use('/paypal', paypalWebhookRouter());

beforeEach(async () => {
  const { clientId } = await seedContact(organizationId);
  const invoice = await seedInvoice(clientId);
  await PaymentAttemptModel.create({
    gateway: 'PAYPAL',
    invoiceId: invoice._id.toHexString(),
    invoiceNumber: 'INV-7',
    clientId,
    contactId: 'contact-1',
    amount: 10,
    currency: 'USD',
    externalId: 'ORDER-1',
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const status = async () => (await PaymentAttemptModel.findOne().lean())?.status;
const post = (event: unknown) =>
  request(app)
    .post('/paypal')
    .set('Content-Type', 'application/json')
    .set('paypal-transmission-id', 't-1')
    .set('paypal-transmission-sig', 'sig')
    .send(JSON.stringify(event));

describe('settlePaypalOrder', () => {
  it('does nothing while no PayPal account is configured', async () => {
    await settlePaypalOrder('ORDER-1');

    expect(capture).not.toHaveBeenCalled();
    expect(await status()).toBe('PENDING');
  });

  it('records nothing when the capture has not completed', async () => {
    await configureGateways(['PAYPAL']);
    capture.mockResolvedValue({ completed: false, captureId: '' });

    await settlePaypalOrder('ORDER-1');

    expect(await status()).toBe('PENDING');
  });
});

describe('the PayPal webhook', () => {
  it('refuses every delivery while no PayPal account is configured', async () => {
    await post({ event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: 'ORDER-1' } }).expect(400);

    expect(verify).not.toHaveBeenCalled();
  });

  describe('with an account', () => {
    beforeEach(async () => {
      await configureGateways(['PAYPAL']);
      capture.mockResolvedValue({ completed: true, captureId: 'CAP-1' });
      verify.mockResolvedValue(true);
    });

    it('captures and records an approved order, after PayPal vouches for the delivery', async () => {
      const event = { event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: 'ORDER-1' } };

      await post(event).expect(200);

      expect(verify).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 'pp-client' }),
        'WH-1',
        expect.objectContaining({ transmissionId: 't-1', transmissionSig: 'sig' }),
        event,
      );
      expect(capture).toHaveBeenCalledWith(expect.anything(), 'ORDER-1');
      expect(await status()).toBe('PAID');
    });

    it('settles a completed capture through the order it belongs to', async () => {
      const event = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: { id: 'CAP-1', supplementary_data: { related_ids: { order_id: 'ORDER-1' } } },
      };

      await post(event).expect(200);

      expect(await status()).toBe('PAID');
    });

    it.each([
      [
        'a voided order',
        {
          event_type: 'CHECKOUT.ORDER.VOIDED',
          resource: { supplementary_data: { related_ids: { order_id: 'ORDER-1' } } },
        },
      ],
      [
        'a denied capture',
        {
          event_type: 'PAYMENT.CAPTURE.DENIED',
          resource: { supplementary_data: { related_ids: { order_id: 'ORDER-1' } } },
        },
      ],
    ])('expires the attempt on %s', async (_label, event) => {
      await post(event).expect(200);

      expect(await status()).toBe('EXPIRED');
      expect(capture).not.toHaveBeenCalled();
    });

    it('acknowledges an event that names no order', async () => {
      await post({ event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: {} }).expect(200);
      await post({ event_type: 'CHECKOUT.ORDER.APPROVED' }).expect(200);

      expect(capture).not.toHaveBeenCalled();
    });

    it('refuses a delivery PayPal does not vouch for', async () => {
      verify.mockResolvedValue(false);

      await post({ event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: 'ORDER-1' } }).expect(
        400,
      );

      expect(await status()).toBe('PENDING');
    });

    it('refuses a delivery with no JSON body to verify', async () => {
      await request(app).post('/paypal').set('Content-Type', 'text/plain').send('x').expect(400);

      expect(verify).not.toHaveBeenCalled();
    });

    it('answers 500, so PayPal retries, when the check itself fails', async () => {
      const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
      verify.mockRejectedValue(new Error('PayPal: down'));

      await post({ event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: 'ORDER-1' } }).expect(
        500,
      );

      expect(logged).toHaveBeenCalledWith(expect.anything(), 'PayPal webhook failed');
    });
  });
});
