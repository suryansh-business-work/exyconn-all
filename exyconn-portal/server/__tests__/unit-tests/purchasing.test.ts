import { ProductModel } from '../../src/modules/products/products.model';
import { SupplierModel } from '../../src/modules/products/supplier.model';
import { StockMovementModel } from '../../src/modules/products/stock-movement.model';
import { PurchaseOrderModel } from '../../src/modules/products/purchase-order.model';
import { productsPurchasingResolvers } from '../../src/modules/products/products.purchasing';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const ctx = {
  user: { id: 'u1', email: 'buyer@x.com', roles: [ROLES.PRODUCTS] },
} as unknown as GraphQLContext;

const receive = productsPurchasingResolvers.Mutation.receivePurchaseOrder as unknown as (
  p: unknown,
  args: { id: string; lines: Array<{ productId: string; quantity: number }> },
  ctx: GraphQLContext,
) => Promise<{ status: string }>;

async function seed(unitCost = 100, quantity = 10) {
  const supplier = await SupplierModel.create({ name: 'Widgets Ltd', code: 'WID' });
  const product = await ProductModel.create({
    name: 'Widget',
    sku: `SKU-${Math.random().toString(36).slice(2, 8)}`,
    price: 250,
    category: 'Parts',
    stock: 0,
    averageCost: 0,
    status: 'ACTIVE',
  });
  const order = await PurchaseOrderModel.create({
    number: `PO-${Math.random().toString(36).slice(2, 8)}`,
    supplierId: String(supplier._id),
    supplierName: supplier.name,
    lines: [
      {
        productId: String(product._id),
        productName: product.name,
        quantity,
        unitCost,
        taxPercent: 0,
        receivedQuantity: 0,
      },
    ],
    currency: 'INR',
    status: 'ORDERED',
    orderDate: new Date('2026-03-01'),
  });
  return { product, order };
}

describe('receiving a purchase order', () => {
  it('books stock in and gives it a cost basis', async () => {
    const { product, order } = await seed(100, 10);

    const result = await receive(
      null,
      { id: String(order._id), lines: [{ productId: String(product._id), quantity: 10 }] },
      ctx,
    );

    expect(result.status).toBe('RECEIVED');
    const after = await ProductModel.findById(product._id).lean();
    expect(after?.stock).toBe(10);
    // The whole point: stock no longer appears from nowhere without a cost.
    expect(after?.averageCost).toBe(100);
  });

  it('writes a RECEIPT movement carrying the cost and the order it came from', async () => {
    const { product, order } = await seed(100, 5);

    await receive(
      null,
      { id: String(order._id), lines: [{ productId: String(product._id), quantity: 5 }] },
      ctx,
    );

    const movement = await StockMovementModel.findOne({ productId: String(product._id) }).lean();
    expect(movement?.reason).toBe('RECEIPT');
    expect(movement?.unitCost).toBe(100);
    expect(movement?.purchaseOrderNumber).toBe(order.number);
    expect(movement?.stockAfter).toBe(5);
  });

  it('is PARTIALLY_RECEIVED until the rest turns up, and adds across receipts', async () => {
    const { product, order } = await seed(100, 10);

    const partial = await receive(
      null,
      { id: String(order._id), lines: [{ productId: String(product._id), quantity: 4 }] },
      ctx,
    );
    expect(partial.status).toBe('PARTIALLY_RECEIVED');

    const complete = await receive(
      null,
      { id: String(order._id), lines: [{ productId: String(product._id), quantity: 6 }] },
      ctx,
    );
    expect(complete.status).toBe('RECEIVED');
    expect((await ProductModel.findById(product._id).lean())?.stock).toBe(10);
  });

  it('averages the cost across deliveries at different prices', async () => {
    const { product, order } = await seed(100, 10);
    await receive(
      null,
      { id: String(order._id), lines: [{ productId: String(product._id), quantity: 10 }] },
      ctx,
    );

    // A second order for the same product, dearer this time.
    const second = await PurchaseOrderModel.create({
      number: 'PO-SECOND',
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      lines: [
        {
          productId: String(product._id),
          productName: product.name,
          quantity: 10,
          unitCost: 200,
          taxPercent: 0,
          receivedQuantity: 0,
        },
      ],
      currency: 'INR',
      status: 'ORDERED',
      orderDate: new Date('2026-04-01'),
    });

    await receive(
      null,
      { id: String(second._id), lines: [{ productId: String(product._id), quantity: 10 }] },
      ctx,
    );

    // 10 at 100 plus 10 at 200 is 150 each — not 200, which would revalue the whole shelf
    // on a delivery that changed nothing about what was already on it.
    expect((await ProductModel.findById(product._id).lean())?.averageCost).toBe(150);
  });

  it('refuses to receive against a cancelled order', async () => {
    const { product, order } = await seed();
    await PurchaseOrderModel.updateOne({ _id: order._id }, { status: 'CANCELLED' });

    await expect(
      receive(
        null,
        { id: String(order._id), lines: [{ productId: String(product._id), quantity: 1 }] },
        ctx,
      ),
    ).rejects.toThrow(/cancelled/i);
  });

  it('refuses a product that is not on the order', async () => {
    const { order } = await seed();
    const other = await ProductModel.create({
      name: 'Other',
      sku: 'SKU-OTHER',
      price: 10,
      category: 'Parts',
      status: 'ACTIVE',
    });

    await expect(
      receive(
        null,
        { id: String(order._id), lines: [{ productId: String(other._id), quantity: 1 }] },
        ctx,
      ),
    ).rejects.toThrow(/not on this order/i);
  });

  it('refuses a receipt of nothing', async () => {
    const { order } = await seed();

    await expect(receive(null, { id: String(order._id), lines: [] }, ctx)).rejects.toThrow(
      /what arrived/i,
    );
  });
});
