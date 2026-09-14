import { AppSettingsModel } from '../admin/settings.model';
import { currentOrganizationId } from '../../lib/tenant/tenant-scope';
import { logger } from '../../utils/logger';
import { FALLBACK_LOCALE, canonicalLocale } from './locale.constants';
import { TranslationModel, translationKey, type TranslationSource } from './translation.model';
import { TRANSLATE_BATCH, machineTranslate } from './i18n.translate';

/**
 * The caller's workspace settings, or null for a request that belongs to no workspace.
 *
 * The translation catalogue is platform data, but the default language and whether a company
 * lets the machine translate are that company's own. exyconn.com, a portal's sign-in screen
 * and a signed-out tracker belong to no company at all — and reading the settings there threw
 * "no organization in scope", which took every public translation request down with it: the
 * website could neither load its words nor ask for new ones, and stayed in English.
 */
export async function workspaceSettings() {
  if (currentOrganizationId() === null) {
    return null;
  }
  return AppSettingsModel.findOne({ key: 'global' }).lean();
}

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
  const rows = await TranslationModel.find({ locale: canonical }).select('key source text').lean();
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
  /** Asked only when there is something new to send the model; false means "not now". */
  mayUseModel: () => boolean = () => true,
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
  if (!mayUseModel()) {
    logger.warn({ locale, count: missing.length }, 'Translation rate-limited for this caller');
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
  const settings = await workspaceSettings();
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

/** Languages being filled right now, so a second click never pays for the same work twice. */
const filling = new Set<string>();

/** What starting a fill reports straight away, before any of it is done. */
export interface LanguageFill {
  locale: string;
  /** Strings the catalogue knows in some language but not in this one. */
  queued: number;
  /** True when a fill of this language was already under way; nothing new was started. */
  alreadyRunning: boolean;
  /** Settles with how many strings were stored, once the background work is over. */
  finished: Promise<number>;
}

/**
 * Translates, in the background, every string the catalogue has seen in ANY language into
 * this one.
 *
 * Browsing fills a language one screen at a time, so a language nobody has read in yet starts
 * out English everywhere. This is the administrator saying "do it all now": the English words
 * the portals and the website have already reported are sent to the model in batches, one
 * after another, and land in the catalogue as they finish. It goes through `translateMissing`,
 * which checks the catalogue again before each batch — a string somebody translated in the
 * meantime, or corrected by hand, is never paid for or overwritten.
 */
export async function fillLanguage(locale: string): Promise<LanguageFill> {
  const canonical = canonicalLocale(locale) ?? FALLBACK_LOCALE;
  const nothing = { locale: canonical, queued: 0, finished: Promise.resolve(0) };
  if (canonical === FALLBACK_LOCALE) {
    return { ...nothing, alreadyRunning: false };
  }
  if (filling.has(canonical)) {
    return { ...nothing, alreadyRunning: true };
  }

  const [sources, present] = await Promise.all([
    TranslationModel.distinct('source'),
    TranslationModel.find({ locale: canonical }).select('source').lean(),
  ]);
  const known = new Set(present.map((row) => row.source));
  const missing = (sources as string[]).filter((source) => !known.has(source));
  if (missing.length === 0) {
    return { ...nothing, alreadyRunning: false };
  }

  filling.add(canonical);
  const finished = (async () => {
    let stored = 0;
    try {
      for (let start = 0; start < missing.length; start += TRANSLATE_BATCH) {
        const batch = missing.slice(start, start + TRANSLATE_BATCH);
        stored += (await translateMissing(canonical, batch)).length;
      }
      logger.info({ locale: canonical, queued: missing.length, stored }, 'Filled a language');
      return stored;
    } catch (err) {
      logger.error({ err, locale: canonical }, 'Filling a language stopped part-way');
      return stored;
    } finally {
      filling.delete(canonical);
    }
  })();

  return { locale: canonical, queued: missing.length, alreadyRunning: false, finished };
}
