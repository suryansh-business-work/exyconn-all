import type { ColDef } from 'ag-grid-community';
import { dateColumn, statusColumn, textColumn } from '@exyconn/crud';
import type { ListStockMovementsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedMovementRow =
  ListStockMovementsPagedQuery['listStockMovementsPaged']['rows'][number];

/**
 * Column model for the stock movement log. There is no actions column: a
 * movement is a record of something that happened, so it is corrected by
 * recording the opposite movement, never by editing history.
 */
export const MOVEMENT_COLUMNS: ColDef<PagedMovementRow>[] = [
  dateColumn('createdAt', 'When'),
  textColumn('productName', 'Product'),
  statusColumn('reason', 'Reason'),
  textColumn('quantity', 'Qty'),
  textColumn('stockAfter', 'Stock after'),
  textColumn('supplierName', 'Supplier'),
  textColumn('reference', 'Reference'),
];
