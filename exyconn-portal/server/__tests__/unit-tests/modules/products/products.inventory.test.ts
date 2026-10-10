import { Types } from 'mongoose';
import { productsInventoryResolvers } from '../../../../src/modules/products/products.inventory';
import { ProductModel } from '../../../../src/modules/products/products.model';
import { StockMovementModel } from '../../../../src/modules/products/stock-movement.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

const as = (roles: string[], email?: string) =>
  ({ user: { id: 'u1', email, roles } }) as unknown as GraphQLContext;
const buyer = as([ROLES.PRODUCTS], 'buyer@exyconn.com');
const outsider = as([ROLES.HR], 'hr@exyconn.com');

const Q = productsInventoryResolvers.Query as unknown as Record<
  string,
  (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>
>;

interface MovementInput {
  productId: string;
  reason: string;
  quantity: number;
  supplierId?: string;
  reference?: string;
  notes?: string;
}

const record = (input: MovementInput, ctx = buyer) =>
  productsInventoryResolvers.Mutation.recordStockMovement(null, { input }, ctx) as Promise<
    Record<string, unknown>
  >;

const seedProduct = (stock: number, sku = 'LAMP-1') =>
  ProductModel.create({ name: 'Desk lamp', sku, price: 1200, category: 'Office', stock });

describe('recordStockMovement', () => {
  it('adds a return to the level and fills the optional fields with blanks', async () => {
    const product = await seedProduct(4);

    const movement = await record({
      productId: product._id.toHexString(),
      reason: 'RETURN',
      quantity: 2,
    });

    expect(movement).toMatchObject({
      stockAfter: 6,
      supplierId: '',
      supplierName: '',
      reference: '',
      notes: '',
      recordedBy: 'buyer@exyconn.com',
    });
    expect((await ProductModel.findById(product._id).lean())?.stock).toBe(6);
  });

  it('keeps the reference and notes it is given', async () => {
    const product = await seedProduct(0);

    const movement = await record({
      productId: product._id.toHexString(),
      reason: 'RECEIPT',
      quantity: 3,
      reference: 'GRN-7',
      notes: 'Box dented',
    });

    expect(movement).toMatchObject({ reference: 'GRN-7', notes: 'Box dented' });
  });

  it('records a blank author when the session carries no email', async () => {
    const product = await seedProduct(1);

    const movement = await record(
      { productId: product._id.toHexString(), reason: 'RECEIPT', quantity: 1 },
      as([ROLES.PRODUCTS]),
    );

    expect(movement.recordedBy).toBe('');
  });

  it('names the shortfall when a movement would empty the shelf below zero', async () => {
    const product = await seedProduct(2);

    await expect(
      record({ productId: product._id.toHexString(), reason: 'ISSUE', quantity: 3 }),
    ).rejects.toThrow('That would take Desk lamp to -1. Only 2 are in stock.');
  });

  it('allows an issue that empties the shelf exactly', async () => {
    const product = await seedProduct(2);

    const movement = await record({
      productId: product._id.toHexString(),
      reason: 'ISSUE',
      quantity: 2,
    });

    expect(movement.stockAfter).toBe(0);
  });

  it('reports a product that does not exist', async () => {
    const productId = new Types.ObjectId().toHexString();

    expect(await codeOf(record({ productId, reason: 'RECEIPT', quantity: 1 }))).toBe('NOT_FOUND');
  });

  it('reports a supplier that does not exist and moves nothing', async () => {
    const product = await seedProduct(5);

    expect(
      await codeOf(
        record({
          productId: product._id.toHexString(),
          reason: 'RECEIPT',
          quantity: 1,
          supplierId: new Types.ObjectId().toHexString(),
        }),
      ),
    ).toBe('NOT_FOUND');
    expect((await ProductModel.findById(product._id).lean())?.stock).toBe(5);
    expect(await StockMovementModel.countDocuments()).toBe(0);
  });

  it('is only for the products team', async () => {
    const product = await seedProduct(5);

    expect(
      await codeOf(
        record({ productId: product._id.toHexString(), reason: 'RECEIPT', quantity: 1 }, outsider),
      ),
    ).toBe('FORBIDDEN');
  });
});

async function seedLedger() {
  const product = await seedProduct(10);
  const productId = product._id.toHexString();
  const moves = [
    { reason: 'RECEIPT', quantity: 5, at: '2026-01-01' },
    { reason: 'ISSUE', quantity: 2, at: '2026-01-02' },
    { reason: 'ISSUE', quantity: 1, at: '2026-01-03' },
  ];
  for (const move of moves) {
    const movement = await record({ productId, reason: move.reason, quantity: move.quantity });
    // Written apart in time, so "newest first" does not hang on the same millisecond.
    await StockMovementModel.collection.updateOne(
      { _id: new Types.ObjectId(String(movement.id)) },
      { $set: { createdAt: new Date(move.at) } },
    );
  }
}

describe('reading the movement ledger', () => {
  it('lists every movement, newest first', async () => {
    await seedLedger();

    const rows = (await Q.listStockMovements(null, {}, buyer)) as Array<{
      id: string;
      stockAfter: number;
    }>;

    expect(rows.map((row) => row.stockAfter)).toEqual([12, 13, 15]);
    expect(rows[0].id).toEqual(expect.any(String));
  });

  it('counts movements by reason', async () => {
    await seedLedger();

    const stats = (await Q.listStockMovementsStats(null, {}, buyer)) as {
      total: number;
      counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
      sums: unknown[];
    };

    expect(stats.total).toBe(3);
    expect(stats.sums).toEqual([]);
    expect(stats.counts[0].field).toBe('reason');
    expect(stats.counts[0].buckets).toEqual(
      expect.arrayContaining([
        { value: 'RECEIPT', count: 1 },
        { value: 'ISSUE', count: 2 },
      ]),
    );
  });

  it('keeps every read to the products team', async () => {
    expect(await codeOf(Q.listStockMovements(null, {}, outsider))).toBe('FORBIDDEN');
    expect(await codeOf(Q.listStockMovementsStats(null, {}, outsider))).toBe('FORBIDDEN');
    expect(
      await codeOf(Q.listStockMovementsPaged(null, { input: { page: 0, pageSize: 5 } }, outsider)),
    ).toBe('FORBIDDEN');
  });
});
