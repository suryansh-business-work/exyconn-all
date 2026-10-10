import { Types } from 'mongoose';
import { emitWebhookBestEffort } from '../../../../src/modules/integrations';
import { productsPurchasingResolvers } from '../../../../src/modules/products/products.purchasing';
import { ProductModel } from '../../../../src/modules/products/products.model';
import { StockMovementModel } from '../../../../src/modules/products/stock-movement.model';
import { PurchaseOrderModel } from '../../../../src/modules/products/purchase-order.model';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { M, buyer, orderInput, seedCatalogue, type OrderRow } from './purchasing.fixtures';
import { asArg } from '../../../mockAs';

jest.mock('../../../../src/modules/integrations', () => ({
  ...jest.requireActual('../../../../src/modules/integrations'),
  emitWebhookBestEffort: jest.fn(),
}));

const emitted = jest.mocked(emitWebhookBestEffort);

const receive = (id: string, lines: Array<{ productId: string; quantity: number }>, ctx = buyer) =>
  M.receivePurchaseOrder(null, { id, lines }, ctx) as Promise<OrderRow>;

/** An order for 10 widgets at 100 plus 18% tax, as the buyer raises it. */
async function seedOrder() {
  const { supplierId, productId } = await seedCatalogue();
  const order = (await M.createPurchaseOrder(
    null,
    {
      input: orderInput(supplierId, productId, {
        lines: [{ productId, quantity: 10, unitCost: 100, taxPercent: 18 }],
      }),
    },
    buyer,
  )) as OrderRow;
  return { productId, orderId: order.id, supplierId };
}

beforeEach(() => invalidatePermissionCache());

describe('receivePurchaseOrder', () => {
  it('announces the order once, on the delivery that completes it', async () => {
    const { productId, orderId, supplierId } = await seedOrder();

    const partial = await receive(orderId, [{ productId, quantity: 4 }]);
    expect(partial.status).toBe('PARTIALLY_RECEIVED');
    expect(partial.firstReceivedAt).toBeInstanceOf(Date);
    expect(partial.receivedAt).toBeNull();
    expect(emitted).not.toHaveBeenCalled();

    const complete = await receive(orderId, [{ productId, quantity: 6 }]);
    expect(complete.status).toBe('RECEIVED');
    expect(complete.receivedAt).toBeInstanceOf(Date);
    expect(complete.firstReceivedAt).toEqual(partial.firstReceivedAt);
    expect(emitted).toHaveBeenCalledTimes(1);
    expect(emitted).toHaveBeenCalledWith(
      'purchase_order.received',
      expect.objectContaining({
        purchaseOrderId: orderId,
        number: 'PO-0001',
        supplierId,
        supplierName: 'Widgets Ltd',
        total: 1180,
        currency: 'INR',
        receivedAt: expect.any(String),
      }),
    );

    // An extra unit turning up later does not file the supplier's bill a second time.
    const over = await receive(orderId, [{ productId, quantity: 1 }]);
    expect(over.status).toBe('RECEIVED');
    expect(emitted).toHaveBeenCalledTimes(1);
  });

  it('leaves a draft where it is while still booking the stock in', async () => {
    const { supplierId, productId } = await seedCatalogue();
    const draft = (await M.createPurchaseOrder(
      null,
      { input: orderInput(supplierId, productId, { status: 'DRAFT' }) },
      buyer,
    )) as OrderRow;

    const result = await receive(draft.id, [{ productId, quantity: 4 }]);

    expect(result.status).toBe('DRAFT');
    expect(result.receivedAt).toBeNull();
    expect((await ProductModel.findById(productId).lean())?.stock).toBe(4);
    expect(emitted).not.toHaveBeenCalled();
  });

  it('records a blank author when the session carries no email', async () => {
    const { productId, orderId } = await seedOrder();
    const noEmail = {
      user: { id: 'u2', roles: [ROLES.PRODUCTS] },
    } as unknown as GraphQLContext;

    await receive(orderId, [{ productId, quantity: 1 }], noEmail);

    expect((await StockMovementModel.findOne({ productId }).lean())?.recordedBy).toBe('');
  });

  it.each([0, -2])('refuses a received quantity of %p and books nothing', async (quantity) => {
    const { productId, orderId } = await seedOrder();

    await expect(receive(orderId, [{ productId, quantity }])).rejects.toThrow(/more than zero/);
    expect((await ProductModel.findById(productId).lean())?.stock).toBe(0);
  });

  it('reports an order that does not exist', async () => {
    const { productId } = await seedCatalogue();

    expect(
      await codeOf(receive(new Types.ObjectId().toHexString(), [{ productId, quantity: 1 }])),
    ).toBe('NOT_FOUND');
  });

  it('reports a product deleted after it was ordered', async () => {
    const { productId, orderId } = await seedOrder();
    await ProductModel.deleteOne({ _id: productId });

    expect(await codeOf(receive(orderId, [{ productId, quantity: 1 }]))).toBe('NOT_FOUND');
    expect(await StockMovementModel.countDocuments()).toBe(0);
  });

  it('is only for the products team', async () => {
    const { productId, orderId } = await seedOrder();
    const hr = { user: { id: 'u3', email: 'hr@exyconn.com', roles: [ROLES.HR] } };

    expect(await codeOf(receive(orderId, [{ productId, quantity: 1 }], asArg(hr)))).toBe(
      'FORBIDDEN',
    );
    expect((await PurchaseOrderModel.findById(orderId).lean())?.status).toBe('ORDERED');
  });
});

describe('PurchaseOrder fields', () => {
  const fields = productsPurchasingResolvers.PurchaseOrder;

  it('reads an order stored without a supplier name or lines as blank and empty', () => {
    expect(fields.supplierName({})).toBe('');
    expect(fields.supplierName({ supplierName: null })).toBe('');
    expect(fields.lines({})).toEqual([]);
    expect(fields.total({})).toBe(0);
  });

  it('passes stored values through and totals the lines with tax', () => {
    const lines = [{ quantity: 2, unitCost: 50, taxPercent: 10 }];

    expect(fields.supplierName({ supplierName: 'Widgets Ltd' })).toBe('Widgets Ltd');
    expect(fields.lines({ lines })).toBe(lines);
    expect(fields.total({ lines })).toBe(110);
  });
});
