import { crmResolvers, crmEntitiesResolvers } from '../../src/modules/crm';
import { DealModel } from '../../src/modules/crm/deal.model';
import { CompanyModel } from '../../src/modules/crm/company.model';
import { financeResolvers } from '../../src/modules/finance';
import { productsPurchasingResolvers } from '../../src/modules/products';
import { PurchaseOrderModel } from '../../src/modules/products/purchase-order.model';
import { ProductModel } from '../../src/modules/products/products.model';
import { fileClientTicket } from '../../src/modules/support/client-ticket.service';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { WebhookModel, WebhookDeliveryModel } from '../../src/modules/integrations/webhook.model';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';
import type { Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

/**
 * Every event a webhook can subscribe to has to be emitted by something.
 *
 * A subscription to an event nobody fires is worse than a missing feature: the endpoint is
 * listed, ticked and silent, and nobody can tell that from a quiet week. This suite drives
 * the real business action behind each event and asserts a delivery was queued for it.
 */

const ctxFor = (role: Role): GraphQLContext => ({
  user: { id: 'user-1', roles: [role], email: 'ops@exyconn.com' },
});

/** An endpoint subscribed to everything, so one seed serves every case. */
async function subscribeToEverything() {
  await WebhookModel.create({
    name: 'Ops bus',
    url: 'https://receiver.example.com/hook',
    events: [
      'invoice.created',
      'invoice.paid',
      'lead.created',
      'deal.won',
      'ticket.created',
      'purchase_order.received',
    ],
    secret: 'whsec_test',
    active: true,
  });
}

const readQueue = async () => {
  const rows = await WebhookDeliveryModel.find().select('event').lean();
  return rows.map((row) => row.event);
};

/**
 * Waits for the queue to hold what the action should have put there.
 *
 * Emitting is deliberately not awaited by the business action — a slow queue insert must not
 * hold up a payment — so a test that reads straight after the mutation is racing it. Polling
 * for the expected set is the honest way to assert on work that is meant to happen just
 * behind the caller's back.
 */
async function expectQueued(events: string[]) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const queued = await readQueue();
    if (queued.length >= events.length) {
      expect([...queued].sort((a, b) => a.localeCompare(b))).toEqual(
        [...events].sort((a, b) => a.localeCompare(b)),
      );
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }
  expect(await readQueue()).toEqual(events);
}

describe('domain events reach subscribed webhooks', () => {
  useTestOrganization();
  beforeEach(subscribeToEverything);

  it('announces an invoice when it is raised', async () => {
    const client = await ClientModel.create({
      name: 'Acme Ltd',
      company: 'Acme Ltd',
      email: 'ap@acme.com',
      phone: '+91 80 4000 1000',
      status: 'ACTIVE',
    });
    await financeResolvers.Mutation.createInvoice(
      null,
      {
        input: {
          number: 'INV-900',
          clientId: String(client._id),
          lines: [{ description: 'Retainer', quantity: 1, rate: 1000, taxPercent: 0 }],
          currency: 'INR',
          status: 'DRAFT',
          issuedDate: new Date(),
          dueDate: new Date(),
        },
      } as never,
      ctxFor(ROLES.FINANCE),
    );

    await expectQueued(['invoice.created']);
  });

  it('announces a lead when it is filed', async () => {
    await crmResolvers.Mutation.createLead(
      null,
      {
        input: {
          name: 'Priya Nair',
          email: 'priya@acme.com',
          source: 'WEBSITE',
          stage: 'NEW',
          value: 50_000,
          owner: 'Asha Rao',
        },
      } as never,
      ctxFor(ROLES.CRM),
    );

    await expectQueued(['lead.created']);
  });

  it('announces a deal the first time it is won, and not again', async () => {
    const company = await CompanyModel.create({
      name: 'Acme Ltd',
      domain: 'acme.com',
      size: '11-50',
      status: 'PROSPECT',
      owner: 'Asha Rao',
    });
    const deal = await DealModel.create({
      title: 'Acme rollout',
      companyId: String(company._id),
      companyName: 'Acme Ltd',
      contactName: 'Priya Nair',
      stage: 'NEGOTIATION',
      value: 250_000,
      probability: 80,
      owner: 'Asha Rao',
    });
    const won = { id: String(deal._id), stage: 'WON' };

    await crmEntitiesResolvers.Mutation.setDealStage(null, won, ctxFor(ROLES.CRM));
    await crmEntitiesResolvers.Mutation.setDealStage(null, won, ctxFor(ROLES.CRM));

    await expectQueued(['deal.won']);
  });

  it('announces a ticket however it was filed', async () => {
    await fileClientTicket(
      {
        requesterName: 'Sam Khan',
        requesterEmail: 'sam@acme.com',
        subject: 'Cannot sign in',
        category: 'IT',
        description: 'The sign-in page rejects my password since this morning.',
        priority: 'HIGH',
      },
      'EMAIL',
    );

    await expectQueued(['ticket.created']);
  });

  it('announces a purchase order once it is fully received', async () => {
    const product = await ProductModel.create({
      name: 'Laptop',
      sku: 'LAP-1',
      category: 'Hardware',
      status: 'ACTIVE',
      price: 90_000,
      currency: 'INR',
      stock: 0,
      reorderLevel: 2,
    });
    const order = await PurchaseOrderModel.create({
      number: 'PO-900',
      supplierId: 'sup-1',
      supplierName: 'Nimbus Supplies',
      status: 'ORDERED',
      currency: 'INR',
      orderDate: new Date(),
      lines: [
        {
          productId: String(product._id),
          productName: 'Laptop',
          quantity: 2,
          unitCost: 80_000,
          taxPercent: 18,
          receivedQuantity: 0,
        },
      ],
    });
    const receive = (quantity: number) =>
      productsPurchasingResolvers.Mutation.receivePurchaseOrder(
        null,
        {
          id: String(order._id),
          lines: [{ productId: String(product._id), quantity }],
        } as never,
        ctxFor(ROLES.PRODUCTS),
      );

    await receive(1);
    expect(await readQueue()).toEqual([]);

    await receive(1);
    await expectQueued(['purchase_order.received']);
  });
});
