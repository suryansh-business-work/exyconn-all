import { badRequest, notFound } from '../../utils/errors';
import { tableQuery, type TableQueryInput } from '../../utils/tableQuery';
import { withId, withIds } from '../../utils/serialize';
import { ClientModel } from '../clients/clients.model';
import { InvoiceModel, OWED_STATUSES } from '../finance/finance.model';
import { PaymentModel } from '../finance/payment.model';
import { emailInvoice, renderInvoice } from '../finance/invoice.send';
import { daysLate } from '../finance/finance.billing';
import { SupportTicketModel } from '../employee/support.model';
import { SupportReplyModel } from '../support/support-reply.model';
import { assertValid, fileClientTicket, normalize } from '../support/client-ticket.service';
import { ProjectModel } from '../projects/projects.model';
import { projectView } from '../projects/share.service';
import type { ClientHubContact } from './clienthub.auth';

/** Who client hub writes are filed under in the audit log and the email log. */
const actorOf = (contact: ClientHubContact) => ({
  id: `client:${contact.id}`,
  name: contact.name,
  email: contact.email,
});

const round2 = (value: number) => Math.round(value * 100) / 100;

const INVOICE_TABLE = {
  searchFields: ['number', 'status'],
  filterFields: ['number', 'status'],
  sortFields: ['number', 'amount', 'status', 'issuedDate', 'dueDate'],
  defaultSort: { field: 'issuedDate', dir: 'DESC' as const },
};
const PAYMENT_TABLE = {
  searchFields: ['invoiceNumber', 'reference', 'method'],
  filterFields: ['invoiceNumber', 'method'],
  sortFields: ['invoiceNumber', 'amount', 'method', 'receivedAt'],
  defaultSort: { field: 'receivedAt', dir: 'DESC' as const },
};
const TICKET_TABLE = {
  searchFields: ['reference', 'subject', 'status'],
  filterFields: ['status', 'priority'],
  sortFields: ['reference', 'subject', 'status', 'priority', 'createdAt', 'updatedAt'],
  defaultSort: { field: 'updatedAt', dir: 'DESC' as const },
};

/** A client sees an invoice once it has gone out: drafts are still the company's business. */
const visibleInvoices = (contact: ClientHubContact) => ({
  clientId: contact.clientId,
  status: { $ne: 'DRAFT' },
});

/** The contact's own client's invoice, or not found — never another client's. */
export async function ownInvoice(contact: ClientHubContact, id: string) {
  const invoice = await InvoiceModel.findOne({ _id: id, ...visibleInvoices(contact) }).lean();
  if (!invoice) notFound('Invoice');
  return invoice;
}

async function ownTicket(contact: ClientHubContact, id: string) {
  const ticket = await SupportTicketModel.findOne({
    _id: id,
    requesterType: 'CLIENT',
    clientId: contact.clientId,
  }).lean();
  if (!ticket) notFound('Ticket');
  return ticket;
}

/**
 * Everything a signed-in client contact can see and do. Every function runs inside the
 * contact's company (the resolvers enter it) and filters by the contact's own client.
 */
export const clientHubService = {
  async me(contact: ClientHubContact) {
    const client = await ClientModel.findById(contact.clientId).select('name company').lean();
    return {
      name: contact.name,
      email: contact.email,
      clientName: client?.name ?? '',
      company: client?.company ?? '',
    };
  },

  async invoices(contact: ClientHubContact, input: TableQueryInput) {
    const page = await tableQuery(InvoiceModel, input, INVOICE_TABLE, visibleInvoices(contact));
    return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
  },

  /** The invoice PDF, base64, for the Download button. */
  async invoicePdf(contact: ClientHubContact, id: string) {
    await ownInvoice(contact, id);
    return (await renderInvoice(id)).pdf.toString('base64');
  },

  /** Emails the invoice, PDF attached, to the contact's own address — nobody else's. */
  async emailInvoice(contact: ClientHubContact, id: string, ip: string) {
    await ownInvoice(contact, id);
    await emailInvoice(id, contact.email, null, { user: null, ip }, actorOf(contact));
    return true;
  },

  async payments(contact: ClientHubContact, input: TableQueryInput) {
    const page = await tableQuery(PaymentModel, input, PAYMENT_TABLE, {
      clientId: contact.clientId,
    });
    return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
  },

  /** What is still owed, soonest due first: overdue ones carry how late they are. */
  async reminders(contact: ClientHubContact, now = new Date()) {
    const rows = await InvoiceModel.find({
      clientId: contact.clientId,
      status: { $in: OWED_STATUSES },
    })
      .sort({ dueDate: 1 })
      .lean();
    return rows
      .map((row) => ({
        invoiceId: String(row._id),
        number: row.number,
        currency: row.currency,
        balance: round2(row.amount - (row.amountPaid ?? 0)),
        dueDate: row.dueDate,
        daysLate: Math.max(0, daysLate(row.dueDate, now)),
        status: row.status,
      }))
      .filter((row) => row.balance > 0);
  },

  async tickets(contact: ClientHubContact, input: TableQueryInput) {
    const page = await tableQuery(SupportTicketModel, input, TICKET_TABLE, {
      requesterType: 'CLIENT',
      clientId: contact.clientId,
    });
    return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
  },

  async ticketReplies(contact: ClientHubContact, id: string) {
    await ownTicket(contact, id);
    const replies = await SupportReplyModel.find({ ticketId: id, internal: false })
      .sort({ createdAt: 1 })
      .lean();
    return withIds(replies);
  },

  /** Files a ticket for the contact's client, on the same terms as every customer ticket. */
  async openTicket(
    contact: ClientHubContact,
    raw: { subject: string; category: string; description: string; priority: string },
  ) {
    const input = normalize({
      ...raw,
      requesterName: contact.name,
      requesterEmail: contact.email,
    });
    assertValid(input);
    const client = await ClientModel.findById(contact.clientId).select('name').lean();
    const ticket = await fileClientTicket(input, 'PORTAL', [], {
      id: contact.clientId,
      name: client?.name ?? '',
    });
    return withId(ticket.toObject());
  },

  async replyToTicket(contact: ClientHubContact, id: string, body: string) {
    const text = body.trim();
    if (text === '' || text.length > 5000) badRequest('Write a reply of up to 5000 characters.');
    await ownTicket(contact, id);
    const reply = await SupportReplyModel.create({
      ticketId: id,
      authorId: `client:${contact.id}`,
      authorName: contact.name,
      body: text,
      internal: false,
    });
    return withId(reply.toObject());
  },

  /** The client's projects, each as the read-only view a share link shows. */
  async projects(contact: ClientHubContact) {
    const projects = await ProjectModel.find({ clientId: contact.clientId })
      .sort({ updatedAt: -1 })
      .lean();
    return Promise.all(
      projects.map(async (project) => ({
        id: String(project._id),
        ...(await projectView(project)),
      })),
    );
  },
};
