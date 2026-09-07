import type { PagedExpenseClaimRow } from '../../expense-claim-grid';

/** The claim being approved: the grid row, which carries the amount that was asked for. */
export type ApproveClaimTarget = PagedExpenseClaimRow;

export interface ApproveClaimFormValues {
  approvedAmount: number;
}
