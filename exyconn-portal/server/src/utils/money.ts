import { normalizeCurrency } from './iso';

/**
 * Money in a record's own currency, written in the company's own notation — "₹ 82,500.00"
 * for a company reading in India, "82.500,00 €" for one reading in Germany.
 *
 * The one place a document (an invoice, a payslip, the email that carries it) turns an
 * amount into text. A currency that is not a real ISO 4217 code prints the bare figure to
 * two places instead of throwing "RangeError: Invalid currency code" halfway through a PDF.
 */
export function formatAmount(amount: number, currency: string, locale: string): string {
  const code = normalizeCurrency(currency);
  if (code === null) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(amount);
}
