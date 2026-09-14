import { activeFormatSettings, formatCurrency } from '@exyconn/i18n';

/**
 * An amount in the company's own money.
 *
 * Money formatting lives in one place so it is never hand-written across the app, and the
 * currency is the company's (Admin › Organizations) rather than a constant in this file —
 * two companies on one portal do not keep books in the same money.
 *
 * A screen should prefer `useFormatters().formatCurrency`, which takes its settings from the
 * React context. This is for the code that cannot: an ag-grid column model built at module
 * scope, or a tile computed in a plain function.
 */
export function formatMoney(amount: number, currency?: string | null): string {
  const settings = activeFormatSettings();
  // A record that stores its own currency — a payslip, an expense claim — is written in it.
  const money = currency ? { ...settings, currency } : settings;
  return formatCurrency(amount, money, { maximumFractionDigits: 0 });
}
