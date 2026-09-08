export { i18nTypeDefs } from './i18n.typeDefs';
export { i18nResolvers } from './i18n.resolvers';
export {
  FALLBACK_LOCALE,
  canonicalLocale,
  directionOf,
  endonymOf,
  isValidLocale,
  resolveEffectiveLocale,
  type TextDirection,
} from './locale.constants';
export { TranslationModel, translationKey } from './translation.model';
export { enabledLocales, readBundle, translateMissing, upsertTranslation } from './i18n.service';
