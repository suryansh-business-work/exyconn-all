import { CompanyExpenseModel } from '../finance/company-expense.model';

/** NOT_BILLED until an approval files a Finance bill; then the bill's own UNPAID or PAID. */
export type VendorPaymentStatus = 'NOT_BILLED' | 'UNPAID' | 'PAID';

/**
 * Adds each invoice's payment status, read from the Finance bill its approval filed — one
 * query for the whole page, so a grid never asks once per row. The bill is the one source of
 * truth: marking it paid in Finance is what the supplier sees as paid.
 */
export async function withPaymentStatus<T extends { expenseId?: string | null }>(
  rows: T[],
): Promise<Array<T & { paymentStatus: VendorPaymentStatus; paidOn: Date | null }>> {
  const ids = rows.map((row) => row.expenseId).filter((id): id is string => Boolean(id));
  const bills =
    ids.length === 0
      ? []
      : await CompanyExpenseModel.find({ _id: { $in: ids } })
          .select('status paidOn')
          .lean();
  const byId = new Map(bills.map((bill) => [String(bill._id), bill]));
  return rows.map((row) => {
    const bill = row.expenseId ? byId.get(row.expenseId) : undefined;
    return {
      ...row,
      paymentStatus: bill?.status ?? 'NOT_BILLED',
      paidOn: bill?.paidOn ?? null,
    };
  });
}
