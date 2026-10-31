import { activeFormatSettings, formatCurrency } from '@exyconn/i18n';

/** An amount in its own currency, in the buying company's number format. */
export const money = (amount: number, currency: string): string =>
  formatCurrency(amount, { ...activeFormatSettings(), currency });
