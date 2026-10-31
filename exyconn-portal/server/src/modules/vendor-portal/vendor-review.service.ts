import { badRequest, notFound } from '../../utils/errors';
import { tableQuery, tableStats, type TableQueryInput } from '../../utils/tableQuery';
import { withId, withIds } from '../../utils/serialize';
import { registerTable } from '../table-transfer/registry';
import { CompanyExpenseModel } from '../finance/company-expense.model';
import { VendorInvoiceModel } from './vendor-invoice.model';
import { withPaymentStatus } from './vendor-invoice.payment';
import { VENDOR_INVOICE_TABLE } from './vendor.service';

/** Vendor invoices land on the books as a supplier's bill for services or goods bought. */
const BILL_CATEGORY = 'SERVICES';
const MAX_NOTE = 1000;

registerTable('listVendorInvoicesPaged', VENDOR_INVOICE_TABLE);

/**
 * The buyer's side of vendor invoices: review what suppliers sent, and file an approved one as a
 * Finance bill (CompanyExpense). Runs in the reviewer's company.
 */
export const vendorReviewService = {
  async list(input: TableQueryInput) {
    const page = await tableQuery(VendorInvoiceModel, input, VENDOR_INVOICE_TABLE);
    const rows = withIds(page.rows as Array<{ _id: unknown; expenseId?: string }>);
    return { rows: await withPaymentStatus(rows), totalCount: page.totalCount };
  },

  stats() {
    return tableStats(VendorInvoiceModel, { countBy: ['status'], sum: ['amount'] });
  },

  /**
   * Approves an invoice and files it as an unpaid Finance bill. The status is claimed first
   * (SUBMITTED → APPROVED in one write), so two reviewers clicking at once file one bill, not
   * two; if filing the bill fails the claim is handed back.
   */
  async approve(id: string, reviewer: string) {
    const invoice = await VendorInvoiceModel.findOneAndUpdate(
      { _id: id, status: 'SUBMITTED' },
      { status: 'APPROVED', reviewedBy: reviewer, reviewedAt: new Date(), reviewNote: '' },
      { new: true },
    ).lean();
    if (!invoice) {
      await this.assertExists(id);
      badRequest('Only an invoice waiting for review can be approved.');
    }
    try {
      const bill = await CompanyExpenseModel.create({
        vendor: invoice.supplierName,
        category: BILL_CATEGORY,
        description: `Invoice ${invoice.invoiceNumber} for ${invoice.purchaseOrderNumber}`,
        amount: invoice.amount,
        currency: invoice.currency,
        incurredOn: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        reference: invoice.invoiceNumber,
        recordedBy: reviewer,
      });
      const filed = await VendorInvoiceModel.findByIdAndUpdate(
        id,
        { expenseId: String(bill._id) },
        { new: true },
      ).lean();
      const [row] = await withPaymentStatus([withId(filed ?? invoice)]);
      return row;
    } catch (error) {
      await VendorInvoiceModel.updateOne(
        { _id: id },
        { status: 'SUBMITTED', reviewedBy: '', reviewedAt: null },
      );
      throw error;
    }
  },

  /** Sends an invoice back with the reason, so the supplier can submit a corrected one. */
  async reject(id: string, reason: string, reviewer: string) {
    const note = reason.trim();
    if (note === '' || note.length > MAX_NOTE) badRequest('Say why, in up to 1000 characters.');
    const invoice = await VendorInvoiceModel.findOneAndUpdate(
      { _id: id, status: 'SUBMITTED' },
      { status: 'REJECTED', reviewedBy: reviewer, reviewedAt: new Date(), reviewNote: note },
      { new: true },
    ).lean();
    if (!invoice) {
      await this.assertExists(id);
      badRequest('Only an invoice waiting for review can be rejected.');
    }
    const [row] = await withPaymentStatus([withId(invoice)]);
    return row;
  },

  async assertExists(id: string) {
    if (!(await VendorInvoiceModel.exists({ _id: id }))) notFound('Vendor invoice');
  },
};
