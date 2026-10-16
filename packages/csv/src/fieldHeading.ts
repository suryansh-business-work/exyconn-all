const WORD_BREAK = /([a-z\d])([A-Z])/g;

/**
 * The heading a field gets in a file when nothing else names it: `billingAddress` becomes
 * `Billing address`. An import template is headed with it and the import wizard matches it
 * back, so the two must read a field the same way.
 */
export function fieldHeading(field: string): string {
  const words = field.replaceAll(WORD_BREAK, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
