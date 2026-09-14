/**
 * The international standards a company is described in, read from the runtime's own ICU
 * tables rather than a list in this repository: ISO 3166-1 alpha-2 countries and ISO 4217
 * currencies, each named in the reader's own language.
 *
 * The server validates the same values against the same tables (`utils/iso.ts`), so a picker
 * here and the check there can never disagree about what a real country or currency is.
 */

export interface IsoOption {
  /** The standard's own code: "DE", "EUR". */
  code: string;
  /** What to show a person: "Germany", "Euro". */
  label: string;
}

function byLabel(a: IsoOption, b: IsoOption): number {
  return a.label.localeCompare(b.label);
}

/** Every ISO 4217 currency this runtime knows, named in `locale`. */
export function currencyOptions(locale: string): IsoOption[] {
  const names = new Intl.DisplayNames([locale], { type: 'currency' });
  return Intl.supportedValuesOf('currency')
    .map((code) => ({ code, label: `${names.of(code) ?? code} (${code})` }))
    .sort(byLabel);
}

/**
 * Every ISO 3166-1 alpha-2 country, named in `locale`. ICU answers with the code itself for
 * anything it does not recognise, which is how the reserved and unassigned ranges drop out.
 */
export function countryOptions(locale: string): IsoOption[] {
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const codes: IsoOption[] = [];
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCodePoint(first) + String.fromCodePoint(second);
      const label = names.of(code);
      if (label !== undefined && label !== code) {
        codes.push({ code, label });
      }
    }
  }
  return codes.sort(byLabel);
}
