import { ProjectModel } from '../../projects/projects.model';
import { InvoiceModel, OWED_STATUSES } from '../../finance/finance.model';
import { PaymentModel } from '../../finance/payment.model';
import { SupportTicketModel, SUPPORT_CLOSED_STATUSES } from '../../employee/support.model';
import { ClientContactModel } from '../contact.model';
import { ClientLinkModel } from './client-link.model';
import { ClientCommunicationModel } from './client-communication.model';
import { ClientSharedItemModel } from './client-shared-item.model';
import { clientOrThrow } from './records.client';

/** How much there is under each tab of a client's page, counted in one round of reads. */
export async function clientSummary(clientId: string) {
  await clientOrThrow(clientId);
  const of = { clientId };
  const [
    contacts,
    invoices,
    openInvoices,
    payments,
    tickets,
    openTickets,
    projects,
    links,
    communications,
    sharedItems,
  ] = await Promise.all([
    ClientContactModel.countDocuments(of),
    InvoiceModel.countDocuments(of),
    InvoiceModel.countDocuments({ ...of, status: { $in: OWED_STATUSES } }),
    PaymentModel.countDocuments(of),
    SupportTicketModel.countDocuments(of),
    SupportTicketModel.countDocuments({ ...of, status: { $nin: [...SUPPORT_CLOSED_STATUSES] } }),
    ProjectModel.countDocuments(of),
    ClientLinkModel.countDocuments(of),
    ClientCommunicationModel.countDocuments(of),
    ClientSharedItemModel.countDocuments(of),
  ]);
  return {
    contacts,
    invoices,
    openInvoices,
    payments,
    tickets,
    openTickets,
    projects,
    links,
    communications,
    sharedItems,
  };
}
