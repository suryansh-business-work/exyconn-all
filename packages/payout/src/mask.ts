import type { PayoutDetails, SecretField } from './methods';

const DOTS = '••••';

/** The last four characters, the rest hidden: `•••• 4321`. */
export const maskTail = (value: string): string => (value ? `${DOTS} ${value.slice(-4)}` : '');

/** An address with its name mostly hidden: `jo••••@gmail.com`, `ra••••@okhdfcbank`. */
export function maskAddress(value: string): string {
  const at = value.lastIndexOf('@');
  if (at < 1) {
    return maskTail(value);
  }
  return value.slice(0, Math.min(2, at)) + DOTS + value.slice(at);
}

/** What a sealed field shows on the page in place of its value. */
export function secretHint(field: SecretField, value: string): string {
  if (!value) {
    return '';
  }
  return field === 'upiId' || field === 'walletEmail' ? maskAddress(value) : maskTail(value);
}

/**
 * One line naming the account without giving it away: `HDFC0001234 · •••• 4321`,
 * `ra••••@okhdfcbank`, `Western Union · Pune`. Shown on lists, payslips and audit entries.
 */
export function payoutSummary(details: PayoutDetails): string {
  switch (details.method) {
    case 'BANK_TRANSFER': {
      const where = details.routingCode || details.bic || details.bankName;
      const account = maskTail(details.iban || details.accountNumber);
      return [where, account].filter(Boolean).join(' · ');
    }
    case 'UPI':
      return details.upiId ? maskAddress(details.upiId) : maskTail(details.phone);
    case 'WESTERN_UNION':
      return [details.city, details.region, details.country].filter(Boolean).join(', ');
    default:
      return maskAddress(details.walletEmail);
  }
}
