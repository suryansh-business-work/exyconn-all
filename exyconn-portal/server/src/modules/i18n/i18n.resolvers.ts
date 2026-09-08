import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { assertPermission } from '../../lib/permissions';
import { withIds } from '../../utils/serialize';
import { AppSettingsModel } from '../admin/settings.model';
import {
  FALLBACK_LOCALE,
  canonicalLocale,
  directionOf,
  endonymOf,
} from './locale.constants';
import { TranslationModel } from './translation.model';
import {
  enabledLocales,
  readBundle,
  translateMissing,
  upsertTranslation,
} from './i18n.service';

const TRANSLATIONS_MODULE = 'Localization';
const adminOnly = [ROLES.ADMIN];

/** How many rows the admin's review screen asks for when it does not say. */
const DEFAULT_PAGE = 50;
const MAX_PAGE = 200;

/** The workspace's own default locale — what an untranslated string falls back to. */
async function fallbackLocale(): Promise<string> {
  const settings = await AppSettingsModel.findOne({ key: 'global' }).lean();
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
    ) => {
      const settings = await AppSettingsModel.findOne({ key: 'global' }).lean();
      if (settings && !settings.autoTranslate) {
        return [];
      }
      return translateMissing(locale, sources);
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
