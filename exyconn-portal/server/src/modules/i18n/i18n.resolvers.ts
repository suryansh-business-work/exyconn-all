import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { assertPlatformStaff } from '../../lib/platformAccess';
import { withIds } from '../../utils/serialize';
import { FALLBACK_LOCALE, canonicalLocale, directionOf, endonymOf } from './locale.constants';
import { TranslationModel } from './translation.model';
import { TRANSLATE_BATCH } from './i18n.translate';
import {
  enabledLocales,
  fillLanguage,
  localeIsOffered,
  readBundle,
  translateMissing,
  upsertTranslation,
  workspaceSettings,
} from './i18n.service';
import { createLimiter } from '../../lib/rateLimiter';

const TRANSLATIONS_MODULE = 'Localization';

/**
 * How often one caller may send strings to the model.
 *
 * This mutation is public — the sign-in screen and the website need it — and each call that
 * reaches the model costs money. Counted only when a call has strings the catalogue does not
 * know yet, so a page whose words are already translated never spends any of it; the budget
 * only has to cover genuinely new copy, which is why it can be this generous and still stop
 * somebody from posting junk to be translated in a loop.
 */
const translationLimiter = createLimiter({
  keyPrefix: 'translate_caller',
  points: 300,
  durationSec: 10 * 60,
});

/**
 * A daily ceiling on top, for callers who are not signed in, per IP. Sized for the website's
 * own server filling a new market's pages (it translates from one address), not for a person.
 */
const anonymousDailyLimiter = createLimiter({
  keyPrefix: 'translate_anonymous_day',
  points: 2000,
  durationSec: 24 * 60 * 60,
});

/**
 * Whether this caller may spend a model call now. A signed-in person keeps the per-caller
 * budget alone. Anybody else may only ask for a locale the platform serves, within both the
 * short budget and the daily one for their IP.
 */
async function mayCallModel(ctx: GraphQLContext, locale: string): Promise<boolean> {
  if (ctx.user) {
    return translationLimiter.allow(ctx.user.id);
  }
  const ip = ctx.ip ?? 'unknown';
  if (!(await localeIsOffered(locale))) {
    return false;
  }
  return (await translationLimiter.allow(ip)) && anonymousDailyLimiter.allow(ip);
}

/** Nothing in the UI is longer; anything that is was not rendered by one of our screens. */
const MAX_SOURCE_LENGTH = 500;

/** At most one model batch per call, and no essays. */
function publicSources(sources: string[]): string[] {
  return sources.filter((source) => source.length <= MAX_SOURCE_LENGTH).slice(0, TRANSLATE_BATCH);
}
/**
 * The catalogue is shared by every company, so reviewing or overriding it is the platform
 * operator's administrators' job (lib/platformAccess), not any company's ADMIN.
 */
const adminOnly = [ROLES.ADMIN];

/** How many rows the admin's review screen asks for when it does not say. */
const DEFAULT_PAGE = 50;
const MAX_PAGE = 200;

/** The workspace's own default locale — what an untranslated string falls back to. */
async function fallbackLocale(): Promise<string> {
  const settings = await workspaceSettings();
  return canonicalLocale(settings?.defaultLocale) ?? FALLBACK_LOCALE;
}

export const i18nResolvers = {
  Query: {
    localeOptions: async () => {
      const tags = await enabledLocales();
      return tags.map((tag) => ({
        tag,
        label: endonymOf(tag),
        direction: directionOf(tag),
      }));
    },

    localeBundle: async (_p: unknown, { locale }: { locale: string }) => {
      const canonical = canonicalLocale(locale) ?? FALLBACK_LOCALE;
      return {
        locale: canonical,
        direction: directionOf(canonical),
        fallbackLocale: await fallbackLocale(),
        translations: await readBundle(canonical),
      };
    },

    translations: async (
      _p: unknown,
      args: { locale: string; search?: string; skip?: number; limit?: number },
      ctx: GraphQLContext,
    ) => {
      await assertPlatformStaff(ctx, TRANSLATIONS_MODULE, adminOnly, 'VIEW');
      const locale = canonicalLocale(args.locale) ?? FALLBACK_LOCALE;
      const filter: Record<string, unknown> = { locale };
      if (args.search?.trim()) {
        // Escaped: an admin searching for "(" must not compile a regex against the whole store.
        const escaped = args.search.trim().replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
        filter.$or = [
          { source: { $regex: escaped, $options: 'i' } },
          { text: { $regex: escaped, $options: 'i' } },
        ];
      }
      const limit = Math.min(args.limit ?? DEFAULT_PAGE, MAX_PAGE);
      const [rows, total] = await Promise.all([
        TranslationModel.find(filter)
          .sort({ updatedAt: -1 })
          .skip(args.skip ?? 0)
          .limit(limit)
          .lean(),
        TranslationModel.countDocuments(filter),
      ]);
      return {
        rows: withIds(rows).map((row) => ({ ...row, kind: row.source_kind })),
        total,
      };
    },
  },

  Mutation: {
    translateMissing: async (
      _p: unknown,
      { locale, sources }: { locale: string; sources: string[] },
      ctx: GraphQLContext,
    ) => {
      const settings = await workspaceSettings();
      // A company can switch the machine off for its own screens. A request from no company
      // — the public website, a sign-in screen — is the platform's, and always translates.
      if (settings && !settings.autoTranslate) {
        return [];
      }
      return translateMissing(locale, publicSources(sources), () => mayCallModel(ctx, locale));
    },

    setTranslation: async (
      _p: unknown,
      { locale, source, text }: { locale: string; source: string; text: string },
      ctx: GraphQLContext,
    ) => {
      await assertPlatformStaff(ctx, TRANSLATIONS_MODULE, adminOnly, 'EDIT');
      return upsertTranslation(locale, source, text, 'HUMAN');
    },

    translateEverything: async (
      _p: unknown,
      { locale }: { locale: string },
      ctx: GraphQLContext,
    ) => {
      await assertPlatformStaff(ctx, TRANSLATIONS_MODULE, adminOnly, 'EDIT');
      // The work carries on after the answer; the screen shows rows as they land.
      const { finished, ...started } = await fillLanguage(locale);
      finished.catch(() => undefined);
      return started;
    },
  },
};
