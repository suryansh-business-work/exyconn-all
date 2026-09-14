/**
 * How a tracker's words reach this package.
 *
 * Several helpers here write whole sentences — the auto-stop notice, the settings list, what
 * the sync bar says — and they bake values into them ("Tracking stops in 12 minutes"). A
 * catalogue cannot be keyed on a sentence that already has a number in it, so these helpers
 * take the translator and look up a template with `{placeholders}` instead.
 *
 * Only the TYPE lives here. The implementation is `@exyconn/i18n`, which is React and so
 * cannot be imported by a package that also runs in Electron's main process — but it is what
 * every caller passes in, and what this package's own tests use.
 */
export type Translate = (source: string, values?: Record<string, string | number>) => string;
