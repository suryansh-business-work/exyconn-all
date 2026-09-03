import { productsInventoryResolvers, suppliersService } from '../../src/modules/products';
import { ProductModel } from '../../src/modules/products/products.model';
import { StockMovementModel } from '../../src/modules/products/stock-movement.model';
import { SupplierModel } from '../../src/modules/products/supplier.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const asProducts: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.PRODUCTS], email: 'buyer@exyconn.com' },
};

interface MovementArgs {
  productId: string;
  reason: string;
  quantity: number;
  supplierId?: string;
}

const record = (input: MovementArgs) =>
  productsInventoryResolvers.Mutation.recordStockMovement(null, { input }, asProducts);

const seedProduct = (stock: number) =>
  ProductModel.create({ name: 'Desk lamp', sku: 'LAMP-1', price: 1200, category: 'Office', stock });

describe('Stock movements', () => {
  beforeAll(async () => {
    await SupplierModel.init();
  });

  it('adds to the level on a receipt and records what it became', async () => {
    const product = await seedProduct(10);

    const movement = await record({
      productId: String(product._id),
      reason: 'RECEIPT',
      quantity: 5,
    });

    expect((movement as { stockAfter: number }).stockAfter).toBe(15);
    expect((await ProductModel.findById(product._id).lean())?.stock).toBe(15);
  });

  it('takes off the level on an issue', async () => {
    const product = await seedProduct(10);

    await record({ productId: String(product._id), reason: 'ISSUE', quantity: 4 });

    expect((await ProductModel.findById(product._id).lean())?.stock).toBe(6);
  });

  it('sets the level outright on a stocktake', async () => {
    const product = await seedProduct(10);

    await record({ productId: String(product._id), reason: 'COUNT', quantity: 7 });

    expect((await ProductModel.findById(product._id).lean())?.stock).toBe(7);
  });

  it('refuses a movement that would take the level below zero', async () => {
    const product = await seedProduct(3);

    await expect(
      record({ productId: String(product._id), reason: 'ISSUE', quantity: 5 }),
    ).rejects.toThrow();

    expect((await ProductModel.findById(product._id).lean())?.stock).toBe(3);
  });

  it('leaves no movement behind when it refuses one', async () => {
    const product = await seedProduct(3);

    await expect(
      record({ productId: String(product._id), reason: 'WRITE_OFF', quantity: 9 }),
    ).rejects.toThrow();

    expect(await StockMovementModel.countDocuments()).toBe(0);
  });

  it('carries the supplier name onto the movement', async () => {
    const supplier = await suppliersService.create({
      name: 'Acme Supplies',
      code: 'ACME-01',
      status: 'ACTIVE',
    });
    const product = await seedProduct(0);

    const movement = await record({
      productId: String(product._id),
      reason: 'RECEIPT',
      quantity: 12,
      supplierId: String((supplier as { _id: unknown })._id),
    });

    expect((movement as { supplierName: string }).supplierName).toBe('Acme Supplies');
  });

  it('refuses a second supplier on the same code', async () => {
    await suppliersService.create({ name: 'Acme Supplies', code: 'ACME-01', status: 'ACTIVE' });

    await expect(
      suppliersService.create({ name: 'Acme Trading', code: 'ACME-01', status: 'ACTIVE' }),
    ).rejects.toThrow();
  });
});
