import { ownAttempt } from '../../../../../src/modules/clienthub/payments/checkout.service';
import {
  PaymentAttemptModel,
  type PaymentGateway,
} from '../../../../../src/modules/clienthub/payments/attempt.model';
import { capturePaypalOrder } from '../../../../../src/modules/clienthub/payments/paypal.client';
import { fetchRazorpayLink } from '../../../../../src/modules/clienthub/payments/razorpay.client';
import { InvoiceModel } from '../../../../../src/modules/finance/finance.model';
import { PaymentModel } from '../../../../../src/modules/finance/payment.model';
import { logger } from '../../../../../src/utils/logger';
import type { ClientHubContact } from '../../../../../src/modules/clienthub/clienthub.auth';
import { useTestOrganization } from '../../../../helpers';
import { configureGateways, seedContact, seedInvoice } from './fixtures';

jest.mock('../../../../../src/modules/clienthub/payments/paypal.client', () => ({
  ...jest.requireActual('../../../../../src/modules/clienthub/payments/paypal.client'),
  capturePaypalOrder: jest.fn(),
}));
jest.mock('../../../../../src/modules/clienthub/payments/razorpay.client', () => ({
  ...jest.requireActual('../../../../../src/modules/clienthub/payments/razorpay.client'),
  fetchRazorpayLink: jest.fn(),
}));

const organizationId = useTestOrganization();
const capture = jest.mocked(capturePaypalOrder);
const readLink = jest.mocked(fetchRazorpayLink);

let contact: ClientHubContact;
let invoiceId: string;

beforeEach(async () => {
  contact = await seedContact(organizationId);
  invoiceId = (await seedInvoice(contact.clientId))._id.toHexString();
});

afterEach(() => {
  jest.restoreAllMocks();
});

const attempt = (gateway: PaymentGateway, fields: Record<string, unknown> = {}) =>
  PaymentAttemptModel.create({
    gateway,
    invoiceId,
    invoiceNumber: 'INV-7',
    clientId: contact.clientId,
    contactId: contact.id,
    amount: 74.5,
    currency: 'USD',
    externalId: 'ORDER-1',
    ...fields,
  });

describe('ownAttempt', () => {
  it('returns one of the contact’s own attempts as it stands', async () => {
    const row = await attempt('STRIPE');

    expect(await ownAttempt(contact, row._id.toHexString())).toMatchObject({
      id: row._id.toHexString(),
      gateway: 'STRIPE',
      status: 'PENDING',
    });
    expect(capture).not.toHaveBeenCalled();
  });

  it('treats another client’s attempt as not found', async () => {
    const row = await attempt('STRIPE', { clientId: 'someone-else' });

    await expect(ownAttempt(contact, row._id.toHexString())).rejects.toThrow('Payment not found');
  });

  it('captures an approved PayPal order on return and records the payment at once', async () => {
    await configureGateways(['PAYPAL']);
    const row = await attempt('PAYPAL');
    capture.mockResolvedValue({ completed: true, captureId: 'CAP-1' });

    const settled = await ownAttempt(contact, row._id.toHexString());

    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'pp-client' }),
      'ORDER-1',
    );
    expect(settled).toMatchObject({ status: 'PAID', gatewayPaymentId: 'CAP-1' });
    expect(await InvoiceModel.findById(invoiceId).lean()).toMatchObject({
      amountPaid: 100,
      status: 'PAID',
    });
  });

  it('leaves the attempt pending when PayPal has not completed the capture', async () => {
    await configureGateways(['PAYPAL']);
    const row = await attempt('PAYPAL');
    capture.mockResolvedValue({ completed: false, captureId: '' });

    expect(await ownAttempt(contact, row._id.toHexString())).toMatchObject({ status: 'PENDING' });
  });

  it('leaves the capture to the webhook when PayPal is not configured', async () => {
    const row = await attempt('PAYPAL');

    expect(await ownAttempt(contact, row._id.toHexString())).toMatchObject({ status: 'PENDING' });
    expect(capture).not.toHaveBeenCalled();
  });

  it('logs a failed capture and still answers, for the webhook to retry', async () => {
    await configureGateways(['PAYPAL']);
    const row = await attempt('PAYPAL');
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    capture.mockRejectedValue(new Error('PayPal: down'));

    expect(await ownAttempt(contact, row._id.toHexString())).toMatchObject({ status: 'PENDING' });
    expect(warned).toHaveBeenCalledWith(
      expect.anything(),
      'Settling the payment on return failed; the webhook will retry',
    );
  });

  it.each([
    ['already paid', { status: 'PAID' }],
    ['without an order yet', { externalId: '' }],
  ])('does not capture a PayPal attempt %s', async (_label, fields) => {
    const row = await attempt('PAYPAL', fields);

    await ownAttempt(contact, row._id.toHexString());

    expect(capture).not.toHaveBeenCalled();
  });

  it('answers with the attempt it read when the row disappears during the capture', async () => {
    await configureGateways(['PAYPAL']);
    const row = await attempt('PAYPAL');
    capture.mockImplementation(async () => {
      await PaymentAttemptModel.deleteOne({ _id: row._id });
      return { completed: false, captureId: '' };
    });

    expect(await ownAttempt(contact, row._id.toHexString())).toMatchObject({
      id: row._id.toHexString(),
      status: 'PENDING',
    });
  });

  describe('Razorpay', () => {
    it('reads a paid link back on return and records the balance on the invoice', async () => {
      await configureGateways(['RAZORPAY']);
      const row = await attempt('RAZORPAY', { externalId: 'plink_1' });
      readLink.mockResolvedValue({ paid: true, paymentId: 'pay_1', method: 'upi' });

      const settled = await ownAttempt(contact, row._id.toHexString());

      expect(readLink).toHaveBeenCalledWith(
        expect.objectContaining({ keyId: 'rzp_id' }),
        'plink_1',
      );
      expect(settled).toMatchObject({ status: 'PAID', gatewayPaymentId: 'pay_1' });
      expect(await InvoiceModel.findById(invoiceId).lean()).toMatchObject({
        amountPaid: 100,
        status: 'PAID',
      });
      expect(await PaymentModel.findOne({ invoiceId }).lean()).toMatchObject({
        amount: 74.5,
        method: 'UPI',
        reference: 'pay_1',
      });
    });

    it('leaves the attempt pending while the link is unpaid', async () => {
      await configureGateways(['RAZORPAY']);
      const row = await attempt('RAZORPAY', { externalId: 'plink_1' });
      readLink.mockResolvedValue({ paid: false, paymentId: '', method: '' });

      expect(await ownAttempt(contact, row._id.toHexString())).toMatchObject({
        status: 'PENDING',
      });
      expect(await InvoiceModel.findById(invoiceId).lean()).toMatchObject({ amountPaid: 25.5 });
    });

    it('leaves it to the webhook when Razorpay is not configured', async () => {
      const row = await attempt('RAZORPAY', { externalId: 'plink_1' });

      expect(await ownAttempt(contact, row._id.toHexString())).toMatchObject({
        status: 'PENDING',
      });
      expect(readLink).not.toHaveBeenCalled();
    });

    it('records the payment once however often the return page polls', async () => {
      await configureGateways(['RAZORPAY']);
      const row = await attempt('RAZORPAY', { externalId: 'plink_1' });
      readLink.mockResolvedValue({ paid: true, paymentId: 'pay_1', method: 'card' });

      await ownAttempt(contact, row._id.toHexString());
      await ownAttempt(contact, row._id.toHexString());

      expect(readLink).toHaveBeenCalledTimes(1);
      expect(await PaymentModel.countDocuments({ invoiceId })).toBe(1);
    });
  });
});
