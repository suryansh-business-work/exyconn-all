/**
 * Gateways take amounts in the currency's smallest unit: paise, cents — or whole yen, which
 * has none. The number of decimals comes from the runtime's own ISO 4217 data.
 */
export function minorUnits(amount: number, currency: string): number {
  const digits =
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return Math.round(amount * 10 ** digits);
}

/** Back from the smallest unit to the invoice's own amount. */
export function majorUnits(minor: number, currency: string): number {
  const digits =
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return minor / 10 ** digits;
}
