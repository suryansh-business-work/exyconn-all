import {
  ExpenseCategory,
  ExpenseState,
  ExpenseStatus,
  InvoiceStatus,
  PaymentMethod,
  RecurrenceFrequency,
  type CompanyExpenseFieldsFragment,
  type ListBudgetsPagedQuery,
  type ListCostCentersPagedQuery,
  type ListExpenseClaimsPagedQuery,
  type ListInvoicesQuery,
  type ListPaymentsPagedQuery,
  type ListRecurringInvoicesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';

type InvoiceRow = ListInvoicesQuery['listInvoices'][number];
type RecurringRow = ListRecurringInvoicesPagedQuery['listRecurringInvoicesPaged']['rows'][number];
type ClaimRow = ListExpenseClaimsPagedQuery['listExpenseClaimsPaged']['rows'][number];
type CostCenterRow = ListCostCentersPagedQuery['listCostCentersPaged']['rows'][number];
type BudgetRow = ListBudgetsPagedQuery['listBudgetsPaged']['rows'][number];
type PaymentRow = ListPaymentsPagedQuery['listPaymentsPaged']['rows'][number];

/** A `listXxxStats` result: `counts` is field -> value -> count, `sums` is field -> total. */
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

/** A stats query that has not answered yet. */
export function pending() {
  return { data: undefined, loading: true, refetch: () => Promise.resolve({}) };
}

export function invoiceRow(overrides: Partial<InvoiceRow> = {}): InvoiceRow {
  return {
    id: 'invoice-1',
    number: 'INV-001',
    clientId: 'client-1',
    clientName: 'Nimbus Ltd',
    lines: [],
    amount: 1000,
    currency: 'INR',
    status: InvoiceStatus.Sent,
    issuedDate: '2026-08-01',
    dueDate: '2026-08-15',
    sentAt: '2026-08-01',
    amountPaid: 250,
    balanceDue: 750,
    dealId: '',
    placeOfSupplyStateCode: '27',
    supplierStateCode: '27',
    subtotal: 1000,
    taxTotal: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    ...overrides,
  };
}

export function recurringRow(overrides: Partial<RecurringRow> = {}): RecurringRow {
  return {
    id: 'recurring-1',
    name: 'Nimbus retainer',
    clientId: 'client-1',
    clientName: 'Nimbus Ltd',
    amount: 50000,
    currency: 'INR',
    placeOfSupplyStateCode: '27',
    frequency: RecurrenceFrequency.Monthly,
    startDate: '2026-01-01',
    nextRunAt: '2026-10-01',
    endDate: null,
    dueDays: 15,
    active: true,
    lastGeneratedAt: null,
    generatedCount: 9,
    createdAt: '2026-01-01',
    updatedAt: '2026-09-01',
    lines: [
      {
        description: 'Support',
        quantity: 1,
        rate: 50000,
        taxPercent: 0,
        hsnSac: '998313',
        amount: 50000,
      },
    ],
    ...overrides,
  };
}

export function claimRow(overrides: Partial<ClaimRow> = {}): ClaimRow {
  return {
    id: 'claim-1',
    employeeId: 'employee-1',
    category: 'Travel',
    description: 'Client visit cab',
    amount: 1200,
    currency: 'INR',
    incurredOn: '2026-09-01',
    receiptUrl: null,
    status: ExpenseStatus.Submitted,
    approvedAmount: null,
    ...overrides,
  };
}

export function companyExpenseRow(
  overrides: Partial<CompanyExpenseFieldsFragment> = {},
): CompanyExpenseFieldsFragment {
  return {
    id: 'expense-1',
    vendor: 'AWS',
    category: ExpenseCategory.Software,
    description: 'Hosting',
    amount: 8000,
    currency: 'INR',
    costCenterId: '',
    incurredOn: '2026-09-01',
    dueDate: '2026-09-15',
    status: ExpenseState.Unpaid,
    paidOn: null,
    reference: 'BILL-9',
    recordedBy: 'Asha',
    ...overrides,
  };
}

export function costCenterRow(overrides: Partial<CostCenterRow> = {}): CostCenterRow {
  return {
    id: 'centre-1',
    code: 'ENG',
    name: 'Engineering',
    description: 'Product and platform',
    ownerId: 'user-1',
    isActive: true,
    createdAt: '2026-01-01',
    ...overrides,
  };
}

export function budgetRow(overrides: Partial<BudgetRow> = {}): BudgetRow {
  return {
    id: 'budget-1',
    costCenterId: 'centre-1',
    month: '2026-09',
    amount: 100000,
    currency: 'INR',
    note: 'Hiring',
    createdAt: '2026-08-20',
    ...overrides,
  };
}

export function paymentRow(overrides: Partial<PaymentRow> = {}): PaymentRow {
  return {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    invoiceNumber: 'INV-001',
    clientId: 'client-1',
    amount: 2500,
    currency: 'INR',
    method: PaymentMethod.BankTransfer,
    reference: 'UTR-1',
    notes: '',
    receivedAt: '2026-09-02',
    recordedBy: 'Asha',
    createdAt: '2026-09-02',
    ...overrides,
  };
}
