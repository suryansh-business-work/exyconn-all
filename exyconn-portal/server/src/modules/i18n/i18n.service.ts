import { AppSettingsModel } from '../admin/settings.model';
import { logger } from '../../utils/logger';
import { FALLBACK_LOCALE, canonicalLocale } from './locale.constants';
import { TranslationModel, translationKey, type TranslationSource } from './translation.model';
import { TRANSLATE_BATCH, machineTranslate } from './i18n.translate';

/** One string and what it reads as in a locale. */
export interface TranslationEntry {
  key: string;
  source: string;
  text: string;
}

/**
 * Every translation a locale has, as the client caches it.
 *
 * The whole bundle rather than per-string lookups: a portal screen asks about a few hundred
 * strings, and a round-trip each would be slower than the page it is translating.
 */
export async function readBundle(locale: string): Promise<TranslationEntry[]> {
  const canonical = canonicalLocale(locale);
  if (!canonical || canonical === FALLBACK_LOCALE) {
    // English needs no bundle: the source string in the code IS the English text.
    return [];
  }
  const rows = await TranslationModel.find({ locale: canonical })
    .select('key source text')
    .lean();
  return rows.map((row) => ({ key: row.key, source: row.source, text: row.text }));
}

/** Stores one translation, overwriting whatever was there. */
export async function upsertTranslation(
  locale: string,
  source: string,
  text: string,
  kind: TranslationSource,
  model = '',
): Promise<TranslationEntry> {
  const canonical = canonicalLocale(locale) ?? FALLBACK_LOCALE;
  const key = translationKey(source);
  await TranslationModel.updateOne(
    { locale: canonical, key },
    { $set: { source, text, source_kind: kind, model } },
    { upsert: true },
  );
  return { key, source, text };
}

/**
 * Fills in strings a locale has no translation for, and answers with what it managed.
 *
 * Called by the client the first time a screen renders a string nobody has seen before, so
 * it has to be safe to call constantly: strings already stored are skipped without touching
 * the model, a human edit is never overwritten, and a batch that fails leaves the strings
 * untranslated for the next attempt rather than storing English as if it were a translation.
 */
export async function translateMissing(
  locale: string,
  sources: string[],
): Promise<TranslationEntry[]> {
  const canonical = canonicalLocale(locale);
  if (!canonical || canonical === FALLBACK_LOCALE || sources.length === 0) {
    return [];
  }

  const wanted = [...new Set(sources.filter((source) => source.trim() !== ''))];
  const keys = wanted.map(translationKey);
  const existing = await TranslationModel.find({ locale: canonical, key: { $in: keys } })
    .select('key')
    .lean();
  const known = new Set(existing.map((row) => row.key));
  const missing = wanted.filter((source) => !known.has(translationKey(source)));
  if (missing.length === 0) {
    return [];
  }

  const translated = await machineTranslate(canonical, missing.slice(0, TRANSLATE_BATCH));
  const stored: TranslationEntry[] = [];
  for (const entry of translated) {
    stored.push(await upsertTranslation(canonical, entry.source, entry.text, 'AUTO', entry.model));
  }
  if (stored.length > 0) {
    logger.info({ locale: canonical, count: stored.length }, 'Machine-translated new strings');
  }
  return stored;
}

/** The locales a workspace offers, always including its own default and English. */
export async function enabledLocales(): Promise<string[]> {
  const settings = await AppSettingsModel.findOne({ key: 'global' }).lean();
  const locales = new Set<string>([FALLBACK_LOCALE]);
  for (const tag of settings?.enabledLocales ?? []) {
    const canonical = canonicalLocale(tag);
    if (canonical) {
      locales.add(canonical);
    }
  }
  const fallback = canonicalLocale(settings?.defaultLocale);
  if (fallback) {
    locales.add(fallback);
  }
  return [...locales];
}
