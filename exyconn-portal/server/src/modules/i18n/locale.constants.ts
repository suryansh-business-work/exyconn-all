/**
 * Locale rules for the whole portal — the ONE place that decides whether a locale tag is
 * usable, what it is called, and which way its script runs.
 *
 * There is deliberately no hardcoded list of "supported" languages: which locales a
 * workspace offers is a setting an admin edits (Admin › Localization), and any BCP-47 tag
 * this runtime can resolve is fair game. What lives here are the rules, not the data.
 */

/** The locale everything falls back to when nothing else resolves. */
export const FALLBACK_LOCALE = 'en';

/**
 * Languages written right-to-left, by ISO 639-1/639-3 code.
 *
 * A constant because it is a property of the script, not of this business: Arabic runs
 * right-to-left in every workspace that ever enables it. `Intl.Locale#textInfo` would say
 * the same thing but is not available on every runtime the server and the browsers run on,
 * and a page that guesses the direction wrong is unreadable rather than merely untranslated.
 */
const RTL_LANGUAGES = new Set([
  'ar', // Arabic
  'arc', // Aramaic
  'ckb', // Central Kurdish
  'dv', // Divehi
  'fa', // Persian
  'he', // Hebrew
  'ks', // Kashmiri
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'ur', // Urdu
  'yi', // Yiddish
]);

export type TextDirection = 'ltr' | 'rtl';

/**
 * The canonical form of a locale tag, or null when the runtime cannot resolve it.
 *
 * Canonicalising rather than string-comparing is what stops `EN-us`, `en-US` and `en_US`
 * becoming three different rows in the translation store for one language.
 */
export function canonicalLocale(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const [canonical] = Intl.getCanonicalLocales(value.replace('_', '-'));
    return canonical ?? null;
  } catch {
    return null;
  }
}

/** Whether `value` is a locale tag this runtime can actually resolve. */
export function isValidLocale(value: string | null | undefined): boolean {
  return canonicalLocale(value) !== null;
}

/**
 * The EFFECTIVE locale for a person, in priority order:
 * their own pick -> the workspace default -> the locale their browser asked for -> English.
 *
 * Each candidate has to resolve to win, for the same reason the timezone chain checks its
 * candidates: the browser's tag is client-supplied and never validated on the way in.
 */
export function resolveEffectiveLocale(candidates: {
  userLocale?: string | null;
  defaultLocale?: string | null;
  requestLocale?: string | null;
}): string {
  const ordered = [candidates.userLocale, candidates.defaultLocale, candidates.requestLocale];
  for (const candidate of ordered) {
    const canonical = canonicalLocale(candidate);
    if (canonical) {
      return canonical;
    }
  }
  return FALLBACK_LOCALE;
}

/** Which way this locale's script runs. */
export function directionOf(locale: string): TextDirection {
  const language = (canonicalLocale(locale) ?? FALLBACK_LOCALE).split('-')[0].toLowerCase();
  return RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
}

/**
 * What this locale is called, in its own language — "Deutsch", not "German".
 *
 * A picker listing every language in English is useless to the person who cannot read
 * English, which is the entire point of the picker.
 */
export function endonymOf(locale: string): string {
  const canonical = canonicalLocale(locale) ?? FALLBACK_LOCALE;
  try {
    return new Intl.DisplayNames([canonical], { type: 'language' }).of(canonical) ?? canonical;
  } catch {
    return canonical;
  }
}
