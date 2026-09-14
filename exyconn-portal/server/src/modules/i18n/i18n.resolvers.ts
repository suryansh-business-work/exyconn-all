import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { assertPermission } from '../../lib/permissions';
import { withIds } from '../../utils/serialize';
import { FALLBACK_LOCALE, canonicalLocale, directionOf, endonymOf } from './locale.constants';
import { TranslationModel } from './translation.model';
import { TRANSLATE_BATCH } from './i18n.translate';
import {
  enabledLocales,
  readBundle,
  translateMissing,
  upsertTranslation,
  workspaceSettings,
} from './i18n.service';
import { createRateLimiter } from '../../utils/rateLimit';

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
const translationLimiter = createRateLimiter(10 * 60 * 1000, 300);

/** Nothing in the UI is longer; anything that is was not rendered by one of our screens. */
const MAX_SOURCE_LENGTH = 500;

/** At most one model batch per call, and no essays. */
function publicSources(sources: string[]): string[] {
  return sources.filter((source) => source.length <= MAX_SOURCE_LENGTH).slice(0, TRANSLATE_BATCH);
}
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
      await assertPermission(ctx, TRANSLATIONS_MODULE, adminOnly, 'VIEW');
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
      const caller = ctx.user?.id ?? ctx.ip ?? 'unknown';
      return translateMissing(locale, publicSources(sources), () => translationLimiter.allow(caller));
    },

    setTranslation: async (
      _p: unknown,
      { locale, source, text }: { locale: string; source: string; text: string },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, TRANSLATIONS_MODULE, adminOnly, 'EDIT');
      return upsertTranslation(locale, source, text, 'HUMAN');
    },
  },
};
