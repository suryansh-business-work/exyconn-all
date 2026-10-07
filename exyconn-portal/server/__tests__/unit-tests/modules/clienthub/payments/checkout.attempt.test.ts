import { ownAttempt } from '../../../../../src/modules/clienthub/payments/checkout.service';
import {
  PaymentAttemptModel,
  type PaymentGateway,
} from '../../../../../src/modules/clienthub/payments/attempt.model';
import { capturePaypalOrder } from '../../../../../src/modules/clienthub/payments/paypal.client';
import { InvoiceModel } from '../../../../../src/modules/finance/finance.model';
import { logger } from '../../../../../src/utils/logger';
import type { ClientHubContact } from '../../../../../src/modules/clienthub/clienthub.auth';
import { useTestOrganization } from '../../../../helpers';
import { configureGateways, seedContact, seedInvoice } from './fixtures';

jest.mock('../../../../../src/modules/clienthub/payments/paypal.client', () => ({
  ...jest.requireActual('../../../../../src/modules/clienthub/payments/paypal.client'),
  capturePaypalOrder: jest.fn(),
}));

const organizationId = useTestOrganization();
const capture = jest.mocked(capturePaypalOrder);

let contact: ClientHubContact;
let invoiceId: string;

beforeEach(async () => {
  contact = await seedContact(organizationId);
  invoiceId = String((await seedInvoice(contact.clientId))._id);
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

    expect(await ownAttempt(contact, String(row._id))).toMatchObject({
      id: String(row._id),
      gateway: 'STRIPE',
      status: 'PENDING',
    });
    expect(capture).not.toHaveBeenCalled();
  });

  it('treats another client’s attempt as not found', async () => {
    const row = await attempt('STRIPE', { clientId: 'someone-else' });

    await expect(ownAttempt(contact, String(row._id))).rejects.toThrow('Payment not found');
  });

  it('captures an approved PayPal order on return and records the payment at once', async () => {
    await configureGateways(['PAYPAL']);
    const row = await attempt('PAYPAL');
    capture.mockResolvedValue({ completed: true, captureId: 'CAP-1' });

    const settled = await ownAttempt(contact, String(row._id));

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

    expect(await ownAttempt(contact, String(row._id))).toMatchObject({ status: 'PENDING' });
  });

  it('leaves the capture to the webhook when PayPal is not configured', async () => {
    const row = await attempt('PAYPAL');

    expect(await ownAttempt(contact, String(row._id))).toMatchObject({ status: 'PENDING' });
    expect(capture).not.toHaveBeenCalled();
  });

  it('logs a failed capture and still answers, for the webhook to retry', async () => {
    await configureGateways(['PAYPAL']);
    const row = await attempt('PAYPAL');
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    capture.mockRejectedValue(new Error('PayPal: down'));

    expect(await ownAttempt(contact, String(row._id))).toMatchObject({ status: 'PENDING' });
    expect(warned).toHaveBeenCalledWith(
      expect.anything(),
      'PayPal capture on return failed; the webhook will retry',
    );
  });

  it.each([
    ['already paid', { status: 'PAID' }],
    ['without an order yet', { externalId: '' }],
  ])('does not capture a PayPal attempt %s', async (_label, fields) => {
    const row = await attempt('PAYPAL', fields);

    await ownAttempt(contact, String(row._id));

    expect(capture).not.toHaveBeenCalled();
  });

  it('answers with the attempt it read when the row disappears during the capture', async () => {
    await configureGateways(['PAYPAL']);
    const row = await attempt('PAYPAL');
    capture.mockImplementation(async () => {
      await PaymentAttemptModel.deleteOne({ _id: row._id });
      return { completed: false, captureId: '' };
    });

    expect(await ownAttempt(contact, String(row._id))).toMatchObject({
      id: String(row._id),
      status: 'PENDING',
    });
  });
});
