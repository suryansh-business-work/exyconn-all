import { InvoiceModel } from './finance.model';
import { RECEIVABLES_SOURCE } from './finance.dunning';
import { registerReminderSource, daysUntil, dueInWords } from '../reminders';
import { ROLES } from '../../constants/roles';
import { formatAmount } from '../../utils/money';
import { companyProfile } from '../../lib/company';
import type { Reminder } from '../reminders';

/** Money to two places — see the note on round2 in finance.billing.ts. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Invoices that have just gone late, told to the finance team once each.
 *
 * Once each, not once a day: the dedupe key carries the invoice and nothing else, so an
 * invoice that goes overdue produces exactly one notice however many weeks it stays there.
 * A daily notice per unpaid invoice is how a finance team ends up with forty of them in a
 * bell they have stopped opening — and the customer-facing chase in finance.dunning.ts is
 * the part that keeps happening on a schedule, which is where the escalation belongs.
 *
 * Itemised rather than summarised, unlike the CRM follow-up queue: an overdue invoice is a
 * specific sum of money owed by a specific customer and someone has to decide what to do
 * about that one, where a follow-up queue is a list to work through.
 */
registerReminderSource({
  key: RECEIVABLES_SOURCE,
  label: 'Overdue invoices',
  async due(now): Promise<Reminder[]> {
    const rows = await InvoiceModel.find({ status: 'OVERDUE' })
      .select('number clientName currency amount amountPaid dueDate')
      .lean();
    if (rows.length === 0) {
      return [];
    }

    const { locale } = await companyProfile();
    return rows.map((invoice) => {
      const balance = round2(invoice.amount - (invoice.amountPaid ?? 0));
      const owed = formatAmount(balance, invoice.currency, locale);
      const late = dueInWords(daysUntil(now, invoice.dueDate));
      return {
        dedupeKey: `invoice-overdue:${String(invoice._id)}`,
        kind: 'FINANCE',
        title: `Invoice ${invoice.number} is overdue`,
        body: `${owed} from ${invoice.clientName || 'the client'} was due ${late}. The customer is being chased by email; call them if it is worth a call.`,
        link: '/finance',
        roles: [ROLES.FINANCE],
      };
    });
  },
});
