/**
 * Formats a numeric amount as a localized currency string. Keeps money
 * formatting in one place so amounts are never hand-formatted across the app.
 */
export function formatMoney(amount: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
