import { formatMoney } from '@exyconn/shell/utils/money';

/**
 * An amount as the page writes it, with whitespace collapsed the way Testing Library
 * normalises on-screen text (Intl puts a non-breaking space in some currencies).
 */
export function money(amount: number, currency?: string | null): string {
  return formatMoney(amount, currency).replaceAll(/\s+/g, ' ');
}
