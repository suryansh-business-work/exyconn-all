import { startPayment } from '../../../../../src/modules/clienthub/payments/checkout.service';
import { PaymentAttemptModel } from '../../../../../src/modules/clienthub/payments/attempt.model';
import { createStripeCheckout } from '../../../../../src/modules/clienthub/payments/stripe.client';
import { createRazorpayLink } from '../../../../../src/modules/clienthub/payments/razorpay.client';
import { createPaypalOrder } from '../../../../../src/modules/clienthub/payments/paypal.client';
import { createPayoneerList } from '../../../../../src/modules/clienthub/payments/payoneer.client';
import { OrganizationModel } from '../../../../../src/modules/organizations';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { invalidatePlatformOperatorCache } from '../../../../../src/lib/platformAccess';
import { logger } from '../../../../../src/utils/logger';
import { env } from '../../../../../src/config/env';
import type { ClientHubContact } from '../../../../../src/modules/clienthub/clienthub.auth';
import { useTestOrganization } from '../../../../helpers';
import { SECRETS, configureGateways, makeOperator, seedContact, seedInvoice } from './fixtures';

jest.mock('../../../../../src/modules/clienthub/payments/stripe.client', () => ({
  ...jest.requireActual('../../../../../src/modules/clienthub/payments/stripe.client'),
  createStripeCheckout: jest.fn(),
}));
jest.mock('../../../../../src/modules/clienthub/payments/razorpay.client', () => ({
  ...jest.requireActual('../../../../../src/modules/clienthub/payments/razorpay.client'),
  createRazorpayLink: jest.fn(),
}));
jest.mock('../../../../../src/modules/clienthub/payments/paypal.client', () => ({
  ...jest.requireActual('../../../../../src/modules/clienthub/payments/paypal.client'),
  createPaypalOrder: jest.fn(),
}));
jest.mock('../../../../../src/modules/clienthub/payments/payoneer.client', () => ({
  ...jest.requireActual('../../../../../src/modules/clienthub/payments/payoneer.client'),
  createPayoneerList: jest.fn(),
}));

const organizationId = useTestOrganization({ country: 'IN' });
const checkout = { externalId: 'ext-1', url: 'https://pay.test/ext-1' };

let contact: ClientHubContact;

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  contact = await seedContact(organizationId);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('startPayment inside the platform operator', () => {
  beforeEach(async () => {
    await makeOperator(organizationId);
  });

  it('opens a Stripe checkout for the whole balance and records the attempt', async () => {
    await configureGateways(['STRIPE']);
    const invoice = await seedInvoice(contact.clientId);
    jest.mocked(createStripeCheckout).mockResolvedValue(checkout);

    const started = await startPayment(contact, invoice._id.toHexString(), 'STRIPE');

    expect(started.url).toBe(checkout.url);
    const attempt = await PaymentAttemptModel.findById(started.attemptId).lean();
    expect(attempt).toMatchObject({
      gateway: 'STRIPE',
      invoiceNumber: 'INV-7',
      clientId: contact.clientId,
      contactId: 'contact-1',
      amount: 74.5,
      currency: 'USD',
      status: 'PENDING',
      externalId: 'ext-1',
    });
    expect(createStripeCheckout).toHaveBeenCalledWith(SECRETS.stripeKey, {
      amount: 74.5,
      currency: 'USD',
      description: 'Invoice INV-7',
      customerEmail: 'dana@acme.test',
      attemptId: started.attemptId,
      successUrl: `${env.clientHubUrl}/payments/return?attempt=${started.attemptId}`,
      cancelUrl: `${env.clientHubUrl}/invoices`,
    });
  });

  it('opens a Razorpay link and a PayPal order with their own keys', async () => {
    await configureGateways(['RAZORPAY', 'PAYPAL']);
    const invoice = await seedInvoice(contact.clientId, { amountPaid: 0, status: 'SENT' });
    jest.mocked(createRazorpayLink).mockResolvedValue(checkout);
    jest.mocked(createPaypalOrder).mockResolvedValue(checkout);

    await startPayment(contact, invoice._id.toHexString(), 'RAZORPAY');
    await startPayment(contact, invoice._id.toHexString(), 'PAYPAL');

    expect(jest.mocked(createRazorpayLink).mock.calls[0][0]).toMatchObject({
      keyId: 'rzp_id',
      keySecret: SECRETS.razorpaySecret,
    });
    expect(jest.mocked(createPaypalOrder).mock.calls[0][0]).toMatchObject({
      clientId: 'pp-client',
      clientSecret: SECRETS.paypalSecret,
    });
    expect(jest.mocked(createPaypalOrder).mock.calls[0][1].amount).toBe(100);
  });

  it('sends Payoneer the client’s country and the notification address', async () => {
    await configureGateways(['PAYONEER']);
    const local = await seedContact(organizationId, 'de');
    const invoice = await seedInvoice(local.clientId);
    jest.mocked(createPayoneerList).mockResolvedValue(checkout);

    await startPayment(local, invoice._id.toHexString(), 'PAYONEER');

    expect(jest.mocked(createPayoneerList).mock.calls[0][1]).toMatchObject({
      country: 'DE',
      notificationUrl: `${env.apiPublicUrl}/webhooks/payoneer`,
    });
  });

  it('falls back to the company’s country for a client with none on file', async () => {
    await configureGateways(['PAYONEER']);
    const invoice = await seedInvoice(contact.clientId);
    jest.mocked(createPayoneerList).mockResolvedValue(checkout);

    await startPayment(contact, invoice._id.toHexString(), 'PAYONEER');

    expect(jest.mocked(createPayoneerList).mock.calls[0][1].country).toBe('IN');
  });

  it('refuses an invoice that is already paid', async () => {
    await configureGateways(['STRIPE']);
    const invoice = await seedInvoice(contact.clientId, { amountPaid: 100, status: 'PAID' });

    await expect(startPayment(contact, invoice._id.toHexString(), 'STRIPE')).rejects.toThrow(
      'Invoice INV-7 is already paid.',
    );
    expect(createStripeCheckout).not.toHaveBeenCalled();
  });

  it('refuses another client’s invoice', async () => {
    const invoice = await seedInvoice('someone-else');

    await expect(startPayment(contact, invoice._id.toHexString(), 'STRIPE')).rejects.toThrow(
      /Invoice not found/,
    );
  });

  it('marks the attempt expired when the gateway refuses to open a checkout', async () => {
    await configureGateways(['STRIPE']);
    const invoice = await seedInvoice(contact.clientId);
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.mocked(createStripeCheckout).mockRejectedValue(new Error('Stripe: down'));

    await expect(startPayment(contact, invoice._id.toHexString(), 'STRIPE')).rejects.toThrow(
      /could not be opened just now/,
    );
    expect(await PaymentAttemptModel.findOne().lean()).toMatchObject({
      status: 'EXPIRED',
      note: 'The gateway refused to open a checkout.',
    });
    expect(logged).toHaveBeenCalled();
  });

  it.each(['STRIPE', 'RAZORPAY', 'PAYPAL', 'PAYONEER'] as const)(
    'expires the attempt when %s has no active account',
    async (gateway) => {
      jest.spyOn(logger, 'error').mockImplementation(() => undefined);
      const invoice = await seedInvoice(contact.clientId);

      await expect(startPayment(contact, invoice._id.toHexString(), gateway)).rejects.toThrow(
        /could not be opened/,
      );
      expect(await PaymentAttemptModel.findOne({ gateway }).lean()).toMatchObject({
        status: 'EXPIRED',
      });
    },
  );

  it('expires a Payoneer attempt when neither client nor company has a country', async () => {
    await configureGateways(['PAYONEER']);
    await runAsPlatform(() =>
      OrganizationModel.updateOne({ _id: organizationId }, { country: '' }),
    );
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const invoice = await seedInvoice(contact.clientId);

    await expect(startPayment(contact, invoice._id.toHexString(), 'PAYONEER')).rejects.toThrow(
      /could not be opened/,
    );
    expect(createPayoneerList).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.objectContaining({ message: expect.stringMatching(/country/) }),
      }),
      'Payment checkout could not be opened',
    );
  });
});
