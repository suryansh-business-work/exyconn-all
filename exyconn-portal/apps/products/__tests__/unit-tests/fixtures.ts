import {
  MovementReason,
  ProductStatus,
  PurchaseOrderStatus,
  SupplierStatus,
  type ListProductsQuery,
  type ListStockMovementsPagedQuery,
  type SupplierFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';
import type { PurchaseOrderRow } from '../../src/pages/purchase-orders/forms/purchase-order';

type ProductRow = ListProductsQuery['listProducts'][number];
type MovementRow = ListStockMovementsPagedQuery['listStockMovementsPaged']['rows'][number];
type PurchaseOrderLine = PurchaseOrderRow['lines'][number];

/**
 * A `listXxxStats` result: `counts` is field -> value -> count, `sums` is field -> total,
 * the same shape the server's one aggregation answers with.
 */
export function tableStats(
  total: number,
  counts: Record<string, Record<string, number>> = {},
  sums: Record<string, number> = {},
): TableStatsShape {
  return {
    total,
    counts: Object.entries(counts).map(([field, buckets]) => ({
      field,
      buckets: Object.entries(buckets).map(([value, count]) => ({ value, count })),
    })),
    sums: Object.entries(sums).map(([field, sum]) => ({ field, total: sum })),
  };
}

export function productRow(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    __typename: 'Product',
    id: 'product-1',
    name: 'Widget',
    sku: 'WID-1',
    price: 250,
    category: 'Hardware',
    stock: 40,
    reorderLevel: 5,
    status: ProductStatus.Active,
    ...overrides,
  };
}

export function supplierRow(
  overrides: Partial<SupplierFieldsFragment> = {},
): SupplierFieldsFragment {
  return {
    __typename: 'Supplier',
    id: 'supplier-1',
    name: 'Acme Supplies',
    code: 'ACME-01',
    contactName: 'Ravi',
    email: 'ravi@acme.io',
    phone: '',
    status: SupplierStatus.Active,
    notes: '',
    ...overrides,
  };
}

export function orderLine(overrides: Partial<PurchaseOrderLine> = {}): PurchaseOrderLine {
  return {
    __typename: 'PurchaseOrderLine',
    productId: 'product-1',
    productName: 'Widget',
    quantity: 10,
    unitCost: 100,
    taxPercent: 18,
    receivedQuantity: 0,
    ...overrides,
  };
}

export function purchaseOrderRow(overrides: Partial<PurchaseOrderRow> = {}): PurchaseOrderRow {
  return {
    __typename: 'PurchaseOrder',
    id: 'po-1',
    number: 'PO-0001',
    supplierId: 'supplier-1',
    supplierName: 'Acme Supplies',
    total: 1180,
    currency: 'INR',
    status: PurchaseOrderStatus.Ordered,
    orderDate: '2026-03-04T00:00:00.000Z',
    expectedDate: null,
    notes: '',
    receivedAt: null,
    createdAt: '2026-03-04T00:00:00.000Z',
    updatedAt: '2026-03-04T00:00:00.000Z',
    lines: [orderLine()],
    ...overrides,
  };
}

export function movementRow(overrides: Partial<MovementRow> = {}): MovementRow {
  return {
    __typename: 'StockMovement',
    id: 'movement-1',
    productId: 'product-1',
    productName: 'Widget',
    reason: MovementReason.Receipt,
    quantity: 1200,
    stockAfter: 1240,
    supplierId: 'supplier-1',
    supplierName: 'Acme Supplies',
    reference: 'PO-0001',
    notes: '',
    recordedBy: 'Priya',
    createdAt: '2026-03-04T00:00:00.000Z',
    ...overrides,
  };
}

/** A query hook's answer once the server has replied, with a refetch that succeeds. */
export function answered<TData>(data: TData) {
  return { data, loading: false, refetch: () => Promise.resolve({ data }) };
}

/** A query hook's answer before the server has replied. */
export function pending() {
  return { data: undefined, loading: true, refetch: () => Promise.resolve({}) };
}
