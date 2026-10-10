import {
  paymentOptions,
  startPayment,
} from '../../../../../src/modules/clienthub/payments/checkout.service';
import { Types } from 'mongoose';
import { PaymentAttemptModel } from '../../../../../src/modules/clienthub/payments/attempt.model';
import { ClientModel } from '../../../../../src/modules/clients/clients.model';
import { InvoiceModel } from '../../../../../src/modules/finance/finance.model';
import { invalidatePlatformOperatorCache } from '../../../../../src/lib/platformAccess';
import type { ClientHubContact } from '../../../../../src/modules/clienthub/clienthub.auth';
import { useTestOrganization } from '../../../../helpers';
import { configureGateways, makeOperator, seedContact, seedInvoice } from './fixtures';

const organizationId = useTestOrganization({ country: 'GB' });

let contact: ClientHubContact;

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  contact = await seedContact(organizationId);
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** The gateway's answer to opening a checkout, for every call the test makes. */
const gatewayAnswers = (body: unknown) =>
  jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => new Response(JSON.stringify(body), { status: 200 }));

describe('online payment outside the platform operator', () => {
  it('offers no gateway, even a configured one, and refuses to start a payment', async () => {
    await configureGateways(['STRIPE']);
    const invoice = await seedInvoice(contact.clientId);

    expect(await paymentOptions(contact)).toEqual({
      stripe: false,
      razorpay: false,
      paypal: false,
      payoneer: false,
    });
    await expect(startPayment(contact, invoice._id.toHexString(), 'STRIPE')).rejects.toThrow(
      /pay by bank transfer/,
    );
    expect(await PaymentAttemptModel.countDocuments()).toBe(0);
  });
});

describe('online payment inside the platform operator', () => {
  beforeEach(async () => {
    await makeOperator(organizationId);
  });

  it('offers exactly the gateways that have an active account', async () => {
    await configureGateways(['STRIPE', 'PAYPAL']);

    expect(await paymentOptions(contact)).toEqual({
      stripe: true,
      razorpay: false,
      paypal: true,
      payoneer: false,
    });
  });

  it('offers every gateway once all four are set up', async () => {
    await configureGateways(['STRIPE', 'RAZORPAY', 'PAYPAL', 'PAYONEER']);

    expect(await paymentOptions(contact)).toEqual({
      stripe: true,
      razorpay: true,
      paypal: true,
      payoneer: true,
    });
  });

  it('charges the whole amount of an invoice written without a paid figure', async () => {
    await configureGateways(['STRIPE']);
    const { insertedId } = await InvoiceModel.collection.insertOne({
      number: 'OLD-1',
      clientId: contact.clientId,
      amount: 100,
      currency: 'USD',
      status: 'SENT',
      issuedDate: new Date('2026-09-01'),
      dueDate: new Date('2026-10-01'),
      organizationId: new Types.ObjectId(organizationId),
    });
    gatewayAnswers({ id: 'cs_old', url: 'https://checkout.stripe.com/c/cs_old' });

    const started = await startPayment(contact, String(insertedId), 'STRIPE');

    expect(started.url).toBe('https://checkout.stripe.com/c/cs_old');
    expect(await PaymentAttemptModel.findById(started.attemptId).lean()).toMatchObject({
      amount: 100,
      externalId: 'cs_old',
    });
  });

  it('sends Payoneer the company’s country once the client record is gone', async () => {
    await configureGateways(['PAYONEER']);
    const invoice = await seedInvoice(contact.clientId);
    await ClientModel.deleteMany({});
    const fetchMock = gatewayAnswers({
      links: { redirect: 'https://pay.test/l/1' },
      identification: { longId: 'L-1' },
    });

    await startPayment(contact, invoice._id.toHexString(), 'PAYONEER');

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).country).toBe('GB');
  });
});
