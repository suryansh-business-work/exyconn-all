import {
  productsInventoryResolvers,
  productsResolvers,
  productsTypeDefs,
  productsInventoryTypeDefs,
  productsPurchasingTypeDefs,
} from '../../../../src/modules/products';
import { ProductModel } from '../../../../src/modules/products/products.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const M = productsResolvers.Mutation as unknown as Record<string, Resolver>;

const as = (roles: string[]) =>
  ({ user: { id: 'u1', email: 'buyer@exyconn.com', roles } }) as unknown as GraphQLContext;
const buyer = as([ROLES.PRODUCTS]);

const base = {
  name: 'Desk lamp',
  sku: 'LAMP-1',
  price: 1200,
  category: 'Office',
  status: 'ACTIVE',
};

beforeAll(async () => {
  await ProductModel.init();
});

describe('products module', () => {
  it('ships the catalogue, inventory and purchasing schemas', () => {
    expect([productsTypeDefs, productsInventoryTypeDefs, productsPurchasingTypeDefs]).toEqual([
      expect.anything(),
      expect.anything(),
      expect.anything(),
    ]);
  });

  it('reads a missing average cost as zero and a stored one as it is', () => {
    expect(productsResolvers.Product.averageCost({})).toBe(0);
    expect(productsResolvers.Product.averageCost({ averageCost: null })).toBe(0);
    expect(productsResolvers.Product.averageCost({ averageCost: 42.5 })).toBe(42.5);
  });

  it('reads a movement written before purchasing existed with a zero cost and no order', () => {
    const { StockMovement } = productsInventoryResolvers;

    expect(StockMovement.unitCost({})).toBe(0);
    expect(StockMovement.unitCost({ unitCost: null })).toBe(0);
    expect(StockMovement.unitCost({ unitCost: 12 })).toBe(12);
    expect(StockMovement.purchaseOrderNumber({})).toBe('');
    expect(StockMovement.purchaseOrderNumber({ purchaseOrderNumber: null })).toBe('');
    expect(StockMovement.purchaseOrderNumber({ purchaseOrderNumber: 'PO-0001' })).toBe('PO-0001');
  });
});

describe('createProduct', () => {
  it('opens a product with no stock when none is given', async () => {
    const created = (await M.createProduct(null, { input: { ...base } }, buyer)) as {
      stock: number;
    };

    expect(created.stock).toBe(0);
  });

  it('passes an error that is not a duplicate SKU through unchanged', async () => {
    const error = await M.createProduct(null, { input: { ...base, name: undefined } }, buyer).then(
      () => null,
      (error_: unknown) => error_ as { name: string },
    );

    expect(error?.name).toBe('ValidationError');
    expect(await ProductModel.countDocuments()).toBe(0);
  });

  it('refuses a caller outside the products team', async () => {
    expect(await codeOf(M.createProduct(null, { input: base }, as([ROLES.HR])))).toBe('FORBIDDEN');
  });
});

describe('updateProduct', () => {
  it('refuses moving a product onto a SKU another product holds', async () => {
    await M.createProduct(null, { input: base }, buyer);
    const pen = (await M.createProduct(
      null,
      { input: { ...base, name: 'Pen', sku: 'PEN-1' } },
      buyer,
    )) as { id: string };

    await expect(
      M.updateProduct(null, { id: pen.id, input: { ...base, name: 'Pen' } }, buyer),
    ).rejects.toThrow('A product with SKU "LAMP-1" already exists.');
    expect((await ProductModel.findById(pen.id).lean())?.sku).toBe('PEN-1');
  });

  it('passes a missing product through as not found', async () => {
    expect(
      await codeOf(M.updateProduct(null, { id: '64b000000000000000000000', input: base }, buyer)),
    ).toBe('NOT_FOUND');
  });
});

describe('inventoryValue', () => {
  it('is zero for an empty catalogue', async () => {
    await expect(productsResolvers.Query.inventoryValue(null, {}, buyer)).resolves.toBe(0);
  });

  it('sums cost times stock over every active product', async () => {
    await ProductModel.create({ ...base, stock: 2, averageCost: 10 });
    await ProductModel.create({ ...base, sku: 'LAMP-2', stock: 3, averageCost: 5.5 });
    await ProductModel.create({
      ...base,
      sku: 'LAMP-3',
      stock: 9,
      averageCost: 9,
      status: 'ARCHIVED',
    });

    await expect(productsResolvers.Query.inventoryValue(null, {}, buyer)).resolves.toBe(36.5);
  });

  it('is only for the products team', async () => {
    expect(await codeOf(productsResolvers.Query.inventoryValue(null, {}, as([ROLES.HR])))).toBe(
      'FORBIDDEN',
    );
  });
});
