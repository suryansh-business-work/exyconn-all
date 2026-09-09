import { ProductModel } from './products.model';
import { productsTypeDefs } from './products.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { badRequest } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

interface ProductInput {
  name: string;
  sku: string;
  price: number;
  category: string;
  stock?: number | null;
  reorderLevel?: number | null;
  status: string;
}

const productsRoles = [ROLES.PRODUCTS];

export const productsService = createCrudService<ProductInput>(ProductModel as never, 'Product');
const crud = createCrudResolvers(productsService, {
  name: 'Product',
  roles: productsRoles,
  table: {
    searchFields: ['name', 'sku', 'category'],
    filterFields: ['name', 'sku', 'category', 'status'],
    sortFields: [
      'name',
      'sku',
      'price',
      'category',
      'stock',
      'reorderLevel',
      'status',
      'createdAt',
    ],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'category'], sum: ['stock'] },
});

/** Mongo's duplicate-key code — the unique SKU index refusing a second product. */
const DUPLICATE_KEY = 11000;

/** Turns the unique-index rejection into the message the form should show. */
function rejectDuplicateSku(error: unknown, sku: string): never {
  if ((error as { code?: number }).code === DUPLICATE_KEY) {
    badRequest(`A product with SKU "${sku}" already exists.`);
  }
  throw error;
}

type CreateArgs = { input: ProductInput };
type UpdateArgs = { id: string; input: ProductInput };

/**
 * What the stock on the shelf COST, over the products that are on sale.
 *
 * Valued at average cost rather than at `price`: the sell price is what we hope to get, and
 * valuing inventory at it books the profit before anything is sold — every unsold shelf would
 * carry a margin nobody has earned. Products received before purchasing existed have no cost
 * basis and contribute nothing, which is honest: their cost is genuinely unknown, and
 * inferring it from the sell price would be inventing a margin rather than recording one.
 *
 * Runs in Mongo so the overview tile never needs the catalogue pulled to the client.
 */
async function inventoryValue(_p: unknown, _a: unknown, ctx: GraphQLContext): Promise<number> {
  assertRole(ctx, productsRoles);
  const [row] = await ProductModel.aggregate<{ total: number }>([
    { $match: { status: 'ACTIVE' } },
    { $group: { _id: null, total: { $sum: { $multiply: ['$averageCost', '$stock'] } } } },
  ]);
  return row?.total ?? 0;
}

export const productsResolvers = {
  /** A product written before purchasing existed has no cost basis stored. */
  Product: { averageCost: (row: { averageCost?: number | null }) => row.averageCost ?? 0 },
  Query: { ...crud.Query, inventoryValue },
  Mutation: {
    ...crud.Mutation,
    createProduct: async (p: unknown, args: CreateArgs, ctx: GraphQLContext) => {
      const input = { ...args.input, stock: args.input.stock ?? 0 };
      try {
        return await crud.Mutation.createProduct(p, { input } as never, ctx);
      } catch (error) {
        return rejectDuplicateSku(error, args.input.sku);
      }
    },
    /**
     * `stock` is stripped: the level is the running total of the movement ledger,
     * and a hand-typed figure would leave a level nothing can explain.
     */
    updateProduct: async (p: unknown, args: UpdateArgs, ctx: GraphQLContext) => {
      const input = { ...args.input };
      delete input.stock;
      try {
        return await crud.Mutation.updateProduct(p, { id: args.id, input } as never, ctx);
      } catch (error) {
        return rejectDuplicateSku(error, args.input.sku);
      }
    },
  },
};
export { productsTypeDefs };
export { productsInventoryTypeDefs } from './products.inventory.typeDefs';
export { productsInventoryResolvers, suppliersService } from './products.inventory';
export { productsPurchasingTypeDefs } from './products.purchasing.typeDefs';
export { productsPurchasingResolvers, purchaseOrdersService } from './products.purchasing';
