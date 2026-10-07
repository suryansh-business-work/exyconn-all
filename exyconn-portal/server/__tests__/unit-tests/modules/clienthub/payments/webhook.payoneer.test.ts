import express from 'express';
import request from 'supertest';
import { payoneerNotifyRouter } from '../../../../../src/modules/clienthub/payments/webhook.wallets';
import { PaymentAttemptModel } from '../../../../../src/modules/clienthub/payments/attempt.model';
import {
  fetchPayoneerCharge,
  type PayoneerCharge,
} from '../../../../../src/modules/clienthub/payments/payoneer.client';
import { PaymentModel } from '../../../../../src/modules/finance/payment.model';
import { logger } from '../../../../../src/utils/logger';
import { useTestOrganization } from '../../../../helpers';
import { configureGateways, seedContact, seedInvoice } from './fixtures';

jest.mock('../../../../../src/modules/clienthub/payments/payoneer.client', () => ({
  ...jest.requireActual('../../../../../src/modules/clienthub/payments/payoneer.client'),
  fetchPayoneerCharge: jest.fn(),
}));

const organizationId = useTestOrganization();
const fetchCharge = jest.mocked(fetchPayoneerCharge);
const app = express();
app.use('/payoneer', payoneerNotifyRouter());

let attemptId: string;

beforeEach(async () => {
  const { clientId } = await seedContact(organizationId);
  const invoice = await seedInvoice(clientId);
  const attempt = await PaymentAttemptModel.create({
    gateway: 'PAYONEER',
    invoiceId: String(invoice._id),
    invoiceNumber: 'INV-7',
    clientId,
    contactId: 'contact-1',
    amount: 10,
    currency: 'EUR',
    externalId: 'L-1',
  });
  attemptId = String(attempt._id);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const status = async () => (await PaymentAttemptModel.findById(attemptId).lean())?.status;
const charged = () => ({
  transactionId: attemptId,
  longId: 'C-1',
  statusCode: 'charged',
  entity: 'payment',
});
const notify = (query: Record<string, string>) => request(app).get('/payoneer').query(query);
const chargeAsReported = (fields: Partial<PayoneerCharge> = {}): PayoneerCharge => ({
  transactionId: attemptId,
  statusCode: 'charged',
  amount: 10.005,
  currency: 'eur',
  ...fields,
});

describe('Payoneer notifications', () => {
  it('are ignored while no Payoneer account is configured', async () => {
    await notify(charged()).expect(200);

    expect(fetchCharge).not.toHaveBeenCalled();
    expect(await status()).toBe('PENDING');
  });

  describe('with an account', () => {
    beforeEach(async () => {
      await configureGateways(['PAYONEER']);
      fetchCharge.mockResolvedValue(chargeAsReported());
    });

    it('record a charge only after Payoneer itself confirms it, amount and currency', async () => {
      await notify(charged()).expect(200);

      expect(fetchCharge).toHaveBeenCalledWith(
        expect.objectContaining({ merchantCode: 'MERCHANT' }),
        'C-1',
      );
      expect(await status()).toBe('PAID');
      expect(await PaymentModel.findOne().lean()).toMatchObject({
        method: 'CARD',
        reference: 'C-1',
      });
    });

    it('accept the notification as a form post, merged with its query', async () => {
      await request(app)
        .post('/payoneer')
        .query({ transactionId: attemptId })
        .type('form')
        .send({ longId: 'C-1', statusCode: 'CHARGED', entity: 'payment' })
        .expect(200);

      expect(await status()).toBe('PAID');
    });

    it.each([
      ['another transaction', { transactionId: '64b000000000000000000099' }],
      ['another status', { statusCode: 'pending' }],
      ['another currency', { currency: 'USD' }],
      ['another amount', { amount: 10.02 }],
    ])('refuse a charge Payoneer reports for %s', async (_label, fields) => {
      const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
      fetchCharge.mockResolvedValue(chargeAsReported(fields));

      await notify(charged()).expect(200);

      expect(await status()).toBe('PENDING');
      expect(warned).toHaveBeenCalledWith(
        { attemptId },
        'Payoneer notification did not match the charge Payoneer reports',
      );
    });

    it.each(['ABORTED', 'failed', 'declined', 'expired'])(
      'expire the attempt on %s',
      async (code) => {
        await notify({ transactionId: attemptId, statusCode: code }).expect(200);

        expect(await status()).toBe('EXPIRED');
        expect(fetchCharge).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['an in-between status', { ...charged(), statusCode: 'pending' }],
      ['a charge that is not about a payment', { ...charged(), entity: 'session' }],
      [
        'a charge with no charge id',
        { transactionId: '', statusCode: 'charged', entity: 'payment' },
      ],
      ['no status at all', { transactionId: '' }],
    ])('leave the attempt alone on %s', async (_label, query) => {
      await notify({ ...query, transactionId: query.transactionId || attemptId }).expect(200);

      expect(await status()).toBe('PENDING');
      expect(fetchCharge).not.toHaveBeenCalled();
    });

    it('ignore a transaction id that is not an attempt id, or names no Payoneer attempt', async () => {
      await notify({ ...charged(), transactionId: 'not-an-id' }).expect(200);
      await notify({ ...charged(), transactionId: '64b000000000000000000099' }).expect(200);
      await request(app).get('/payoneer').expect(200);

      expect(fetchCharge).not.toHaveBeenCalled();
    });

    it('ignore an attempt that is already settled', async () => {
      await PaymentAttemptModel.updateOne({ _id: attemptId }, { status: 'PAID' });

      await notify(charged()).expect(200);

      expect(fetchCharge).not.toHaveBeenCalled();
    });

    it('answer 500 when Payoneer cannot be asked about the charge', async () => {
      const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
      fetchCharge.mockRejectedValue(new Error('Payoneer: down'));

      await notify(charged()).expect(500);

      expect(logged).toHaveBeenCalledWith(expect.anything(), 'Payoneer notification failed');
    });
  });
});
