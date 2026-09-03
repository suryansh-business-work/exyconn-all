import { ProductModel } from './products.model';
import { SupplierModel } from './supplier.model';
import { OUTGOING_REASONS, StockMovementModel } from './stock-movement.model';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../utils/tableQuery';
import type { GraphQLContext } from '../../middleware/auth';

const productsRoles = [ROLES.PRODUCTS];

interface SupplierInput {
  name: string;
  code: string;
  contactName?: string;
  email?: string;
  phone?: string;
  status: string;
  notes?: string;
}

interface StockMovementInput {
  productId: string;
  reason: string;
  quantity: number;
  supplierId?: string;
  reference?: string;
  notes?: string;
}

export const suppliersService = createCrudService<SupplierInput>(SupplierModel as never, 'Supplier');

const suppliers = createCrudResolvers(suppliersService, {
  name: 'Supplier',
  roles: productsRoles,
  table: {
    searchFields: ['name', 'code', 'contactName', 'email'],
    filterFields: ['name', 'code', 'status'],
    sortFields: ['name', 'code', 'status', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status'] },
});

/** Movements are written by `recordStockMovement`, so they are read-only here. */
const MOVEMENT_TABLE: TableConfig = {
  searchFields: ['productName', 'supplierName', 'reference'],
  filterFields: ['productName', 'reason', 'supplierName'],
  sortFields: ['productName', 'reason', 'quantity', 'createdAt'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};

/** What a movement does to the level. A stocktake sets it; the rest add or remove. */
function levelAfter(current: number, reason: string, quantity: number): number {
  if (reason === 'COUNT') {
    return quantity;
  }
  if (OUTGOING_REASONS.has(reason)) {
    return current - quantity;
  }
  return current + quantity;
}

/**
 * Records the movement and moves the product's stock with it. The level is
 * written from the movement rather than typed by hand, so a stock figure can
 * always be explained by the rows behind it.
 */
async function recordStockMovement(
  _p: unknown,
  { input }: { input: StockMovementInput },
  ctx: GraphQLContext,
) {
  assertRole(ctx, productsRoles);
  const product = await ProductModel.findById(input.productId);
  if (!product) {
    notFound('Product');
  }

  const stockAfter = levelAfter(product.stock, input.reason, input.quantity);
  if (stockAfter < 0) {
    badRequest(
      `That would take ${product.name} to ${stockAfter}. Only ${product.stock} are in stock.`,
    );
  }

  let supplierName = '';
  if (input.supplierId) {
    const supplier = await SupplierModel.findById(input.supplierId).select('name').lean();
    if (!supplier) {
      notFound('Supplier');
    }
    supplierName = supplier.name;
  }

  const movement = await StockMovementModel.create({
    productId: input.productId,
    productName: product.name,
    reason: input.reason,
    quantity: input.quantity,
    stockAfter,
    supplierId: input.supplierId ?? '',
    supplierName,
    reference: input.reference ?? '',
    notes: input.notes ?? '',
    recordedBy: ctx.user?.email ?? '',
  });

  product.stock = stockAfter;
  await product.save();

  return withId(movement.toObject());
}

export const productsInventoryResolvers = {
  Query: {
    ...suppliers.Query,
    listStockMovements: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, productsRoles);
      return withIds(await StockMovementModel.find().sort({ createdAt: -1 }).lean());
    },
    listStockMovementsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, productsRoles);
      const page = await tableQuery(StockMovementModel, input, MOVEMENT_TABLE);
      return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
    },
    listStockMovementsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, productsRoles);
      const buckets = await StockMovementModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$reason', count: { $sum: 1 } } },
      ]);
      return {
        total: await StockMovementModel.countDocuments(),
        counts: [
          {
            field: 'reason',
            buckets: buckets.map((b) => ({ value: b._id, count: b.count })),
          },
        ],
        sums: [],
      };
    },
  },
  Mutation: {
    ...suppliers.Mutation,
    recordStockMovement,
  },
};

export { productsInventoryTypeDefs } from './products.inventory.typeDefs';
