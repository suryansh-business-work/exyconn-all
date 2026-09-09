import {
  productsInventoryResolvers,
  productsResolvers,
  suppliersService,
} from '../../src/modules/products';
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

  it("lists one product's history through the productId filter", async () => {
    const lamp = await seedProduct(10);
    const chair = await ProductModel.create({
      name: 'Chair',
      sku: 'CHAIR-1',
      price: 3000,
      category: 'Office',
      stock: 2,
    });
    await record({ productId: String(lamp._id), reason: 'RECEIPT', quantity: 1 });
    await record({ productId: String(chair._id), reason: 'RECEIPT', quantity: 1 });

    const page = (await productsInventoryResolvers.Query.listStockMovementsPaged(
      null,
      {
        input: {
          page: 0,
          pageSize: 20,
          filters: [{ field: 'productId', op: 'EQUALS', value: String(lamp._id) }],
        },
      },
      asProducts,
    )) as unknown as { rows: Array<{ productName: string }>; totalCount: number };

    expect(page.totalCount).toBe(1);
    expect(page.rows[0].productName).toBe('Desk lamp');
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

describe('Product catalogue', () => {
  beforeAll(async () => {
    await ProductModel.init();
  });

  const create = (input: Record<string, unknown>) =>
    productsResolvers.Mutation.createProduct(null, { input } as never, asProducts);

  const base = {
    name: 'Desk lamp',
    sku: 'LAMP-1',
    price: 1200,
    category: 'Office',
    status: 'ACTIVE',
  };

  it('refuses a second product on the same SKU with a readable message', async () => {
    await create({ ...base, stock: 1 });

    await expect(create({ ...base, name: 'Other lamp' })).rejects.toThrow('LAMP-1');
  });

  it('takes opening stock on create and defaults the reorder level', async () => {
    const product = (await create({ ...base, stock: 4 })) as {
      stock: number;
      reorderLevel: number;
    };

    expect(product.stock).toBe(4);
    expect(product.reorderLevel).toBe(5);
  });

  it('ignores stock on update so the ledger stays the only way to move it', async () => {
    const product = (await create({ ...base, stock: 4 })) as { id: string };

    const updated = (await productsResolvers.Mutation.updateProduct(
      null,
      { id: product.id, input: { ...base, stock: 99, reorderLevel: 2 } } as never,
      asProducts,
    )) as { stock: number; reorderLevel: number };

    expect(updated.stock).toBe(4);
    expect(updated.reorderLevel).toBe(2);
  });

  it('values the inventory at what the stock COST, over active products only', async () => {
    // Not at `price`: the sell price is what we hope to get, and valuing inventory at it
    // books the profit before anything is sold.
    await create({ ...base, stock: 2, averageCost: 500 });
    await create({
      ...base,
      sku: 'LAMP-2',
      price: 100,
      stock: 3,
      averageCost: 40,
      status: 'DRAFT',
    });

    const value = await productsResolvers.Query.inventoryValue(null, {}, asProducts);

    // Only the ACTIVE product counts: 2 × 500.
    expect(value).toBe(1000);
  });

  it('values a product with no cost basis at nothing rather than guessing one', async () => {
    // A catalogue written before purchasing existed has no cost. Inferring it from the sell
    // price would invent a margin rather than record one.
    await create({ ...base, stock: 2 });

    expect(await productsResolvers.Query.inventoryValue(null, {}, asProducts)).toBe(0);
  });

  it('counts products by category for the overview', async () => {
    await create({ ...base, stock: 1 });
    await create({ ...base, sku: 'PEN-1', category: 'Stationery', stock: 1 });

    const listStats = (
      productsResolvers.Query as unknown as Record<
        string,
        (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>
      >
    ).listProductsStats;
    const stats = (await listStats(null, {}, asProducts)) as {
      counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
    };

    const categories = stats.counts.find((c) => c.field === 'category')?.buckets ?? [];
    expect(categories).toEqual(
      expect.arrayContaining([
        { value: 'Office', count: 1 },
        { value: 'Stationery', count: 1 },
      ]),
    );
  });
});
