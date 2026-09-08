/**
 * Locale rules, in the browser.
 *
 * The same rules the server applies in `modules/i18n/locale.constants` — the two runtimes
 * cannot share a module, but they must never disagree: a page rendered right-to-left by one
 * and left-to-right by the other is worse than either.
 */

/** The locale everything falls back to when nothing else resolves. */
export const FALLBACK_LOCALE = 'en';

/**
 * Languages written right-to-left, by ISO 639 code. A property of the script, not of this
 * business — Arabic runs right-to-left in every workspace that ever enables it.
 */
const RTL_LANGUAGES = new Set([
  'ar',
  'arc',
  'ckb',
  'dv',
  'fa',
  'he',
  'ks',
  'ps',
  'sd',
  'ug',
  'ur',
  'yi',
]);

export type TextDirection = 'ltr' | 'rtl';

/**
 * The canonical form of a locale tag, or null when the runtime cannot resolve it.
 *
 * Canonicalising rather than string-comparing is what stops `EN-us`, `en-US` and `en_US`
 * being treated as three different languages.
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
 * The EFFECTIVE locale for the person at the screen, in priority order:
 * their own pick -> the workspace default -> the browser's language -> English.
 */
export function resolveEffectiveLocale(candidates: {
  userLocale?: string | null;
  defaultLocale?: string | null;
  browserLocale?: string | null;
}): string {
  const ordered = [candidates.userLocale, candidates.defaultLocale, candidates.browserLocale];
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

/** What this locale calls itself — "Deutsch", not "German". */
export function endonymOf(locale: string): string {
  const canonical = canonicalLocale(locale) ?? FALLBACK_LOCALE;
  try {
    return new Intl.DisplayNames([canonical], { type: 'language' }).of(canonical) ?? canonical;
  } catch {
    return canonical;
  }
}

/** The language this browser is set to, canonicalised. */
export function browserLocale(): string {
  return canonicalLocale(globalThis.navigator?.language) ?? FALLBACK_LOCALE;
}
