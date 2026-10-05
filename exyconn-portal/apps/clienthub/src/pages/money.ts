import { activeFormatSettings, formatCurrency } from '@exyconn/i18n';

/** An amount in its own currency, in the company's number format. */
export const money = (amount: number, currency: string): string =>
  formatCurrency(amount, { ...activeFormatSettings(), currency });

/** What is still owed on an invoice, to two places. */
export const balanceOf = (invoice: { amount: number; amountPaid?: number | null }): number =>
  Math.round((invoice.amount - (invoice.amountPaid ?? 0)) * 100) / 100;
