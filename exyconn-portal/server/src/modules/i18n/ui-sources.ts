import sources from './ui-sources.json';

/**
 * Every English string the portals, shared packages and trackers render, extracted from their
 * code by scripts/i18n-extract.mjs (`pnpm i18n:extract`). Translate everything fills a language
 * from these as well as from what the catalogue has already seen, so a language nobody has
 * browsed in yet is filled whole, not screen by screen.
 */
export const shippedSources: readonly string[] = sources;
