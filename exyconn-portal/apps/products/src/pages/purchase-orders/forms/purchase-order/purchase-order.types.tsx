import type {
  ListPurchaseOrdersPagedQuery,
  PurchaseOrderStatus,
} from '@exyconn/shell/graphql/generated';

/** One order as the grid and the form read it — codegen-derived, never hand-typed. */
export type PurchaseOrderRow =
  ListPurchaseOrdersPagedQuery['listPurchaseOrdersPaged']['rows'][number];

/** One ordered line as the form edits it. `receivedQuantity` is the order's, never the form's. */
export interface PurchaseOrderLineValues {
  productId: string;
  quantity: number;
  unitCost: number;
  taxPercent: number;
}

export interface PurchaseOrderFormValues {
  supplierId: string;
  lines: PurchaseOrderLineValues[];
  currency: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate: string;
  notes: string;
}

/** What one line costs, tax included — the same arithmetic the server totals the order on. */
export function lineCost(line: PurchaseOrderLineValues): number {
  return Math.round(line.quantity * line.unitCost * (1 + line.taxPercent / 100) * 100) / 100;
}

/** What the lines cost together. */
export function linesTotal(lines: readonly PurchaseOrderLineValues[]): number {
  return Math.round(lines.reduce((total, line) => total + lineCost(line), 0) * 100) / 100;
}
