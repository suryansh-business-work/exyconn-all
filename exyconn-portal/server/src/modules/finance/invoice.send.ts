import { isValidObjectId } from 'mongoose';
import { InvoiceModel } from './finance.model';
import { buildInvoicePdf, formatAmount, invoiceFilename, type InvoicePdfData } from './invoice.pdf';
import { ClientModel } from '../clients/clients.model';
import { getBranding } from '../branding/branding.service';
import { emailer } from '../email';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId } from '../../utils/serialize';
import { notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

const financeRoles = [ROLES.FINANCE];

/** An invoice rendered and ready to hand over — to a download or to an email. */
interface RenderedInvoice {
  filename: string;
  pdf: Buffer;
  data: InvoicePdfData;
}

/**
 * Loads everything the PDF prints. The client row is read for its company and email; if it
 * has since been deleted the invoice still prints, under the name it was written with.
 */
async function renderInvoice(id: string): Promise<RenderedInvoice> {
  const invoice = await InvoiceModel.findById(id).lean();
  if (!invoice) {
    notFound('Invoice');
  }
  const [client, branding] = await Promise.all([
    isValidObjectId(invoice.clientId)
      ? ClientModel.findById(invoice.clientId)
          .select('name company email gstin billingAddress')
          .lean()
      : null,
    getBranding(),
  ]);

  const data: InvoicePdfData = {
    company: {
      name: branding.businessName,
      address: branding.addressLine || branding.address,
      supportEmail: branding.supportEmail,
      gstin: branding.gstin,
      stateCode: branding.stateCode,
      bankDetails: branding.bankDetails,
    },
    client: {
      name: invoice.clientName || client?.name || invoice.clientId,
      company: client?.company ?? '',
      email: client?.email ?? '',
      gstin: client?.gstin ?? '',
      billingAddress: client?.billingAddress ?? '',
    },
    invoice: {
      number: invoice.number,
      currency: invoice.currency,
      status: invoice.status,
      issuedDate: invoice.issuedDate,
      dueDate: invoice.dueDate,
      lines: invoice.lines ?? [],
      amount: invoice.amount,
      amountPaid: invoice.amountPaid ?? 0,
      placeOfSupplyStateCode: invoice.placeOfSupplyStateCode ?? '',
      supplierStateCode: invoice.supplierStateCode ?? '',
    },
  };
  return { filename: invoiceFilename(invoice.number), pdf: await buildInvoicePdf(data), data };
}

/** The invoice as a base64 PDF, for the Download button. */
export async function invoicePdf(_p: unknown, { id }: { id: string }, ctx: GraphQLContext) {
  assertRole(ctx, financeRoles);
  const rendered = await renderInvoice(id);
  return rendered.pdf.toString('base64');
}

/**
 * Emails the invoice to the client with the PDF attached.
 *
 * Goes through the template engine so the wording is an edit in Tech → Email rather than a
 * deploy, and so the send lands in the log with every other email. A draft becomes SENT —
 * the invoice has now, in fact, gone out — while a partly or fully paid one keeps the status
 * the ledger gave it.
 */
export async function sendInvoice(
  _p: unknown,
  { id, email, message }: { id: string; email: string; message?: string | null },
  ctx: GraphQLContext,
) {
  assertRole(ctx, financeRoles);
  const { filename, pdf, data } = await renderInvoice(id);
  const { invoice, client } = data;

  await emailer.send({
    template: 'invoice-sent',
    to: email,
    variables: {
      clientName: client.name,
      invoiceNumber: invoice.number,
      total: formatAmount(invoice.amount, invoice.currency),
      balanceDue: formatAmount(invoice.amount - invoice.amountPaid, invoice.currency),
      dueDate: invoice.dueDate.toISOString().slice(0, 10),
      message: message ?? `Please find invoice ${invoice.number} attached.`,
    },
    attachments: [{ filename, content: pdf }],
    triggeredBy: ctx.user?.email ?? '',
  });

  const update: Record<string, unknown> = { sentAt: new Date() };
  if (invoice.status === 'DRAFT') {
    update.status = 'SENT';
  }
  const saved = await InvoiceModel.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!saved) {
    notFound('Invoice');
  }
  return withId(saved as { _id: unknown });
}
