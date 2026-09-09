import { ProductModel } from './products.model';
import { SupplierModel } from './supplier.model';
import { StockMovementModel } from './stock-movement.model';
import { PurchaseOrderModel, type PurchaseOrderDocument } from './purchase-order.model';
import {
  movingAverageCost,
  orderTotal,
  statusFromReceipts,
  type PurchaseLineShape,
} from './purchase-order.totals';
import { nextSequence } from '../../lib/sequence';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import { assertPermission } from '../../lib/permissions';
import { badRequest, notFound } from '../../utils/errors';
import { withId } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';

const productsRoles = [ROLES.PRODUCTS];
const PO_SERIES = 'purchase-order';
const PO_PREFIX = 'PO-';

interface PurchaseOrderLineInput {
  productId: string;
  quantity: number;
  unitCost: number;
  taxPercent: number;
}

interface PurchaseOrderInput {
  supplierId: string;
  supplierName?: string;
  lines?: PurchaseOrderLineInput[];
  currency: string;
  status: string;
  orderDate: Date;
  expectedDate?: Date | null;
  notes?: string;
  number?: string;
}

export const purchaseOrdersService = createCrudService<PurchaseOrderInput>(
  PurchaseOrderModel as never,
  'PurchaseOrder',
);

const crud = createCrudResolvers(purchaseOrdersService, {
  name: 'PurchaseOrder',
  roles: productsRoles,
  table: {
    searchFields: ['number', 'supplierName'],
    filterFields: ['number', 'supplierName', 'status', 'currency'],
    sortFields: ['number', 'supplierName', 'status', 'orderDate', 'expectedDate', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status'] },
});

/**
 * Fills in what the form is not allowed to decide: the supplier's name and each line's
 * product name, both looked up rather than trusted, so an order can never carry a name that
 * disagrees with the record it points at.
 */
async function completeInput(input: PurchaseOrderInput): Promise<PurchaseOrderInput> {
  const lines = input.lines ?? [];
  if (lines.length === 0) {
    badRequest('Add at least one line — an order for nothing cannot be received.');
  }

  const supplier = await SupplierModel.findById(input.supplierId).select('name').lean();
  if (!supplier) {
    notFound('Supplier');
  }

  const products = await ProductModel.find({ _id: { $in: lines.map((line) => line.productId) } })
    .select('name')
    .lean();
  const nameById = new Map(products.map((product) => [String(product._id), product.name]));

  return {
    ...input,
    supplierName: supplier.name,
    lines: lines.map((line) => {
      const productName = nameById.get(line.productId);
      if (!productName) {
        notFound('Product');
      }
      return { ...line, productName } as PurchaseOrderLineInput;
    }),
  };
}

const createPurchaseOrder = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { input } = args as unknown as { input: PurchaseOrderInput };
  const completed = await completeInput(input);
  // The number is drawn here, never typed: a series with a repeat in it makes a receipt
  // impossible to attribute to the order it belongs to.
  const number = await nextSequence(PO_SERIES, PO_PREFIX);
  return crud.Mutation.createPurchaseOrder(p, { input: { ...completed, number } } as never, ctx);
};

const updatePurchaseOrder = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: PurchaseOrderInput };
  const existing = await PurchaseOrderModel.findById(id).lean();
  if (!existing) {
    notFound('Purchase order');
  }
  const received = (existing.lines ?? []).some((line) => (line.receivedQuantity ?? 0) > 0);
  if (received) {
    badRequest(
      'Some of this order has already arrived, so its lines can no longer be changed. ' +
        'Cancel it and raise a new one for anything still outstanding.',
    );
  }
  const completed = await completeInput(input);
  // `number` and every received quantity stay as they are — the order owns both.
  return crud.Mutation.updatePurchaseOrder(
    p,
    { id, input: { ...completed, number: existing.number } } as never,
    ctx,
  );
};

/** One line of a receipt: how many of an ordered line actually turned up. */
interface ReceiptLineInput {
  productId: string;
  quantity: number;
}

/**
 * Books goods in against an order.
 *
 * This is the whole point of purchase orders: a RECEIPT movement is written carrying the
 * cost from the order line, and the product's average cost moves with it. Before this, stock
 * appeared from nowhere and inventory could only be valued at the price we hoped to sell for.
 *
 * Receiving is additive and idempotent per call, not per order: receiving 4 of 10 twice
 * leaves 8 received, which is what a part-delivered order actually looks like.
 */
const receivePurchaseOrder = async (_p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, lines } = args as unknown as { id: string; lines: ReceiptLineInput[] };
  await assertPermission(ctx, 'PurchaseOrder', productsRoles, 'EDIT');

  const order = await PurchaseOrderModel.findById(id);
  if (!order) {
    notFound('Purchase order');
  }
  if (order.status === 'CANCELLED') {
    badRequest('This order was cancelled. Raise a new one rather than receiving against it.');
  }
  if (lines.length === 0) {
    badRequest('Say what arrived — a receipt with no lines changes nothing.');
  }

  for (const receipt of lines) {
    if (receipt.quantity <= 0) {
      badRequest('A received quantity must be more than zero.');
    }
    const ordered = order.lines.find((line) => line.productId === receipt.productId);
    if (!ordered) {
      badRequest('That product is not on this order.');
    }

    const product = await ProductModel.findById(receipt.productId);
    if (!product) {
      notFound('Product');
    }

    const stockAfter = product.stock + receipt.quantity;
    product.averageCost = movingAverageCost(
      product.stock,
      product.averageCost,
      receipt.quantity,
      ordered.unitCost,
    );
    product.stock = stockAfter;
    await product.save();

    await StockMovementModel.create({
      productId: receipt.productId,
      productName: ordered.productName,
      reason: 'RECEIPT',
      quantity: receipt.quantity,
      stockAfter,
      unitCost: ordered.unitCost,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      purchaseOrderId: String(order._id),
      purchaseOrderNumber: order.number,
      reference: order.number,
      recordedBy: ctx.user?.email ?? '',
    });

    ordered.receivedQuantity = (ordered.receivedQuantity ?? 0) + receipt.quantity;
  }

  const now = new Date();
  order.status = statusFromReceipts(
    order.lines as unknown as PurchaseLineShape[],
    order.status,
  ) as typeof order.status;
  order.firstReceivedAt = order.firstReceivedAt ?? now;
  order.receivedAt = order.status === 'RECEIVED' ? now : null;
  await order.save();

  return withId(order.toObject());
};

export const productsPurchasingResolvers = {
  PurchaseOrder: {
    supplierName: (row: { supplierName?: string | null }) => row.supplierName ?? '',
    lines: (row: { lines?: unknown[] }) => row.lines ?? [],
    /** What the order costs, tax included — computed, so it cannot disagree with its lines. */
    total: (row: { lines?: PurchaseLineShape[] }) => orderTotal(row.lines ?? []),
  },
  Query: { ...crud.Query },
  Mutation: {
    ...crud.Mutation,
    createPurchaseOrder,
    updatePurchaseOrder,
    receivePurchaseOrder,
  },
};

export type { PurchaseOrderDocument };
