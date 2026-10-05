import { InvoiceModel } from './finance.model';
import { emailsByClient, RECEIVABLES_SOURCE } from './finance.dunning';
import { invoicePayUrl } from './invoice.payLink';
import { claimReminder } from '../reminders';
import { emailer } from '../email';
import { recordSystemAudit } from '../audit';
import { companyProfile } from '../../lib/company';
import { formatAmount } from '../../utils/money';
import { logger } from '../../utils/logger';

/** How far ahead of the due date the "due soon" reminder goes out. */
export const DUE_SOON_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Money to two places — see the note on round2 in finance.billing.ts. */
const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Reminds clients, once per invoice, that an unpaid invoice falls due within the next few days,
 * with a "Pay now" link into the client hub. Runs in the hourly receivables sweep, in the
 * company being swept.
 *
 * The reminder is claimed in the reminder log before it is sent (key: invoice), as the overdue
 * chase does: the sweep runs every hour of those three days and must write once.
 */
export async function remindDueSoonInvoices(now = new Date()): Promise<number> {
  const rows = await InvoiceModel.find({
    status: { $in: ['SENT', 'PARTIALLY_PAID'] },
    dueDate: { $gt: now, $lte: new Date(now.getTime() + DUE_SOON_DAYS * MS_PER_DAY) },
  })
    .select('number clientId clientName currency amount amountPaid dueDate')
    .lean();
  const owing = rows.filter((row) => round2(row.amount - (row.amountPaid ?? 0)) > 0);
  if (owing.length === 0) {
    return 0;
  }
  const [addresses, profile] = await Promise.all([
    emailsByClient(owing.map((row) => row.clientId)),
    companyProfile(),
  ]);

  let sent = 0;
  for (const row of owing) {
    const to = addresses.get(row.clientId);
    const id = String(row._id);
    if (!to || !(await claimReminder(RECEIVABLES_SOURCE, `invoice-due-soon:${id}`, 1))) {
      continue;
    }
    try {
      await emailer.send({
        template: 'invoice-due-soon',
        to,
        variables: {
          clientName: row.clientName || 'there',
          invoiceNumber: row.number,
          balanceDue: formatAmount(
            row.amount - (row.amountPaid ?? 0),
            row.currency,
            profile.locale,
          ),
          dueDate: row.dueDate.toISOString().slice(0, 10),
          payUrl: invoicePayUrl(id),
        },
        triggeredBy: 'Invoice due-soon reminder',
      });
      sent += 1;
      await recordSystemAudit({
        action: 'UPDATE',
        module: 'Invoice',
        entityId: id,
        entityLabel: row.number,
        summary: `Sent the due-soon reminder for Invoice ${row.number} to ${to}`,
      });
    } catch (error) {
      logger.error(error, `Due-soon reminder for invoice ${row.number} could not be sent`);
    }
  }
  return sent;
}
