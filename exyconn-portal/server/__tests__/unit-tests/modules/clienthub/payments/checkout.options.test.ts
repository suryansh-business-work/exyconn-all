import {
  paymentOptions,
  startPayment,
} from '../../../../../src/modules/clienthub/payments/checkout.service';
import { Types } from 'mongoose';
import { PaymentAttemptModel } from '../../../../../src/modules/clienthub/payments/attempt.model';
import { ClientModel } from '../../../../../src/modules/clients/clients.model';
import { InvoiceModel } from '../../../../../src/modules/finance/finance.model';
import type { ClientHubContact } from '../../../../../src/modules/clienthub/clienthub.auth';
import { useTestOrganization } from '../../../../helpers';
import { configureGateways, seedContact, seedInvoice } from './fixtures';

const organizationId = useTestOrganization({ country: 'GB' });

let contact: ClientHubContact;

beforeEach(async () => {
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

describe('online payment for a client of any company', () => {
  it('offers the active gateways and starts a payment, though the company is not the operator', async () => {
    await configureGateways(['STRIPE']);
    const invoice = await seedInvoice(contact.clientId);
    gatewayAnswers({ id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' });

    expect(await paymentOptions()).toEqual({
      stripe: true,
      razorpay: false,
      paypal: false,
      payoneer: false,
    });
    const started = await startPayment(contact, invoice._id.toHexString(), 'STRIPE');

    expect(started.url).toBe('https://checkout.stripe.com/c/cs_1');
    const attempt = await PaymentAttemptModel.findById(started.attemptId).lean();
    expect(attempt).toMatchObject({ status: 'PENDING', externalId: 'cs_1' });
  });

  it('offers nothing while no gateway is set up', async () => {
    expect(await paymentOptions()).toEqual({
      stripe: false,
      razorpay: false,
      paypal: false,
      payoneer: false,
    });
  });

  it('offers exactly the gateways that have an active account', async () => {
    await configureGateways(['STRIPE', 'PAYPAL']);

    expect(await paymentOptions()).toEqual({
      stripe: true,
      razorpay: false,
      paypal: true,
      payoneer: false,
    });
  });

  it('offers every gateway once all four are set up', async () => {
    await configureGateways(['STRIPE', 'RAZORPAY', 'PAYPAL', 'PAYONEER']);

    expect(await paymentOptions()).toEqual({
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

    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string).country).toBe('GB');
  });
});
