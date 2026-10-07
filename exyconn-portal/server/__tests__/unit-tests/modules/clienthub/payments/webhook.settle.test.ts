import { expire, settle } from '../../../../../src/modules/clienthub/payments/webhook';
import { PaymentAttemptModel } from '../../../../../src/modules/clienthub/payments/attempt.model';
import { InvoiceModel } from '../../../../../src/modules/finance/finance.model';
import { PaymentModel } from '../../../../../src/modules/finance/payment.model';
import * as billing from '../../../../../src/modules/finance/finance.billing';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { logger } from '../../../../../src/utils/logger';
import { useTestOrganization } from '../../../../helpers';
import { seedContact, seedInvoice } from './fixtures';

const organizationId = useTestOrganization();

let clientId: string;
let invoiceId: string;

beforeEach(async () => {
  clientId = (await seedContact(organizationId)).clientId;
  invoiceId = String((await seedInvoice(clientId))._id);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const attemptFields = () => ({
  gateway: 'STRIPE' as const,
  invoiceId,
  invoiceNumber: 'INV-7',
  clientId,
  contactId: 'contact-1',
  amount: 74.5,
  currency: 'USD',
  externalId: 'cs_1',
});
const settlement = {
  gateway: 'STRIPE' as const,
  externalId: 'cs_1',
  gatewayPaymentId: 'pi_1',
  method: 'CARD' as const,
};

describe('settle', () => {
  it('claims the attempt and records the receipt against its invoice, under the gateway', async () => {
    await PaymentAttemptModel.create(attemptFields());

    await settle(settlement);

    expect(await PaymentAttemptModel.findOne().lean()).toMatchObject({
      status: 'PAID',
      gatewayPaymentId: 'pi_1',
      paidAt: expect.any(Date),
    });
    expect(await PaymentModel.findOne({ invoiceId }).lean()).toMatchObject({
      amount: 74.5,
      method: 'CARD',
      reference: 'pi_1',
      notes: 'Paid online through Stripe from the client hub.',
    });
    expect((await InvoiceModel.findById(invoiceId).lean())?.status).toBe('PAID');
  });

  it('records the payment once however often the gateway retries', async () => {
    await PaymentAttemptModel.create(attemptFields());

    await settle(settlement);
    await settle(settlement);

    expect(await PaymentModel.countDocuments({ invoiceId })).toBe(1);
  });

  it('uses the checkout id as the reference when the gateway sends no payment id', async () => {
    await PaymentAttemptModel.create({ ...attemptFields(), gateway: 'RAZORPAY' });

    await settle({ ...settlement, gateway: 'RAZORPAY', gatewayPaymentId: '', method: 'UPI' });

    expect(await PaymentModel.findOne({ invoiceId }).lean()).toMatchObject({
      reference: 'cs_1',
      method: 'UPI',
      notes: 'Paid online through Razorpay from the client hub.',
    });
  });

  it('ignores a checkout it never opened', async () => {
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await settle({ ...settlement, externalId: 'cs_unknown' });

    expect(warned).toHaveBeenCalledWith('STRIPE payment for unknown checkout cs_unknown');
    expect(await PaymentModel.countDocuments()).toBe(0);
  });

  it('ignores an attempt that belongs to no company', async () => {
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    await runAsPlatform(() => PaymentAttemptModel.create(attemptFields()));

    await settle(settlement);

    expect(warned).toHaveBeenCalled();
    expect(await PaymentModel.countDocuments()).toBe(0);
  });

  it('keeps money it could not record for finance to reconcile', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    await InvoiceModel.updateOne({ _id: invoiceId }, { amountPaid: 100, status: 'PAID' });
    await PaymentAttemptModel.create(attemptFields());

    await settle(settlement);

    const kept = await PaymentAttemptModel.findOne().lean();
    expect(kept?.status).toBe('REVIEW');
    expect(kept?.note).toMatch(/Only 0 is outstanding/);
    expect(logged).toHaveBeenCalledWith(expect.anything(), 'Online payment needs review');
  });

  it('notes "Not recorded" when the failure carries no message', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(billing, 'applyPayment').mockRejectedValue('ledger offline');
    await PaymentAttemptModel.create(attemptFields());

    await settle(settlement);

    expect(await PaymentAttemptModel.findOne().lean()).toMatchObject({
      status: 'REVIEW',
      note: 'Not recorded',
    });
  });
});

describe('expire', () => {
  it('marks a pending checkout expired and leaves a paid one alone', async () => {
    await PaymentAttemptModel.create(attemptFields());
    await PaymentAttemptModel.create({ ...attemptFields(), externalId: 'cs_2', status: 'PAID' });

    await expire('STRIPE', 'cs_1');
    await expire('STRIPE', 'cs_2');

    const statuses = await PaymentAttemptModel.find().sort({ externalId: 1 }).lean();
    expect(statuses.map((row) => row.status)).toEqual(['EXPIRED', 'PAID']);
  });

  it('only touches the named gateway', async () => {
    await PaymentAttemptModel.create(attemptFields());

    await expire('RAZORPAY', 'cs_1');

    expect((await PaymentAttemptModel.findOne().lean())?.status).toBe('PENDING');
  });
});
