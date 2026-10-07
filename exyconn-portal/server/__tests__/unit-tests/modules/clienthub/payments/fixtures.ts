import { ClientModel } from '../../../../../src/modules/clients/clients.model';
import { InvoiceModel } from '../../../../../src/modules/finance/finance.model';
import { OrganizationModel } from '../../../../../src/modules/organizations';
import { gatewayService } from '../../../../../src/modules/clienthub/payments/gateway.service';
import { walletGatewayService } from '../../../../../src/modules/clienthub/payments/gateway.wallets.service';
import { invalidatePlatformOperatorCache } from '../../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import type { PaymentGateway } from '../../../../../src/modules/clienthub/payments/attempt.model';
import type { ClientHubContact } from '../../../../../src/modules/clienthub/clienthub.auth';

/** Shared seeds for the client hub payment suites. Never literal credentials. */
export const SECRETS = {
  stripeKey: `sk_test_${'k'.repeat(24)}`,
  razorpaySecret: `rzp_${'r'.repeat(24)}`,
  paypalSecret: `pp_${'p'.repeat(24)}`,
  payoneerToken: `po_${'t'.repeat(24)}`,
  webhook: `wh_${'w'.repeat(24)}`,
};

/** Flags the suite's company as the one that operates the platform (and owns the gateways). */
export async function makeOperator(organizationId: string): Promise<void> {
  await runAsPlatform(() =>
    OrganizationModel.updateOne({ _id: organizationId }, { isPlatformOperator: true }),
  );
  invalidatePlatformOperatorCache();
}

/** A client in the suite's company, and its signed-in client hub contact. */
export async function seedContact(organizationId: string, country = ''): Promise<ClientHubContact> {
  const client = await ClientModel.create({
    name: 'Dana',
    email: 'dana@acme.test',
    company: 'Acme',
    country,
  });
  return {
    id: 'contact-1',
    clientId: String(client._id),
    name: 'Dana Reyes',
    email: 'dana@acme.test',
    organizationId,
  };
}

export function seedInvoice(clientId: string, fields: Record<string, unknown> = {}) {
  return InvoiceModel.create({
    number: 'INV-7',
    clientId,
    amount: 100,
    amountPaid: 25.5,
    currency: 'USD',
    status: 'PARTIALLY_PAID',
    issuedDate: new Date('2026-09-01T00:00:00.000Z'),
    dueDate: new Date('2026-10-01T00:00:00.000Z'),
    ...fields,
  });
}

const CONFIGURE: Readonly<Record<PaymentGateway, () => Promise<unknown>>> = {
  STRIPE: () =>
    gatewayService.createStripe({
      label: 'Stripe',
      secretKey: SECRETS.stripeKey,
      webhookSecret: SECRETS.webhook,
      isActive: true,
    }),
  RAZORPAY: () =>
    gatewayService.createRazorpay({
      label: 'Razorpay',
      keyId: 'rzp_id',
      keySecret: SECRETS.razorpaySecret,
      webhookSecret: SECRETS.webhook,
      isActive: true,
    }),
  PAYPAL: () =>
    walletGatewayService.createPaypal({
      label: 'PayPal',
      clientId: 'pp-client',
      clientSecret: SECRETS.paypalSecret,
      webhookId: 'WH-1',
      mode: 'SANDBOX',
      isActive: true,
    }),
  PAYONEER: () =>
    walletGatewayService.createPayoneer({
      label: 'Payoneer',
      merchantCode: 'MERCHANT',
      apiToken: SECRETS.payoneerToken,
      mode: 'SANDBOX',
      isActive: true,
    }),
};

/** Sets up an active platform account for each gateway named. */
export async function configureGateways(gateways: readonly PaymentGateway[]): Promise<void> {
  for (const gateway of gateways) {
    await CONFIGURE[gateway]();
  }
}
