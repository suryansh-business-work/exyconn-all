/**
 * Language rules for the trackers, in the same shape as `timezone.ts`.
 *
 * Shared between the main and RENDERER processes, so it uses nothing but `Intl` — no React,
 * no Node builtin. The translation itself lives in `@exyconn/i18n`, which is React and so
 * renderer-only; what a main process needs is only which language to ask the portal for.
 */

/** The language everything falls back to — the one the apps are written in. */
export const FALLBACK_LOCALE = 'en';

/** This machine's own language, as the operating system reports it. */
export function deviceLocale(): string {
  return canonicalLocale(Intl.DateTimeFormat().resolvedOptions().locale) ?? FALLBACK_LOCALE;
}

/** The canonical form of a tag (`EN-us` -> `en-US`), or null when this runtime cannot resolve it. */
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

/**
 * The language the app renders in: whatever the portal resolved for this employee, else this
 * machine's own.
 *
 * The portal has already collapsed their pick, the house default and the locale this device
 * reported into one answer — but it is the far side of a network call, and a tag this runtime
 * cannot resolve would make every formatter in the UI throw.
 */
export function effectiveLocale(preferred: string | null | undefined): string {
  return canonicalLocale(preferred) ?? deviceLocale();
}
