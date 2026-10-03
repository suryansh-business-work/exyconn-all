/**
 * @exyconn/seo — page meta for every Exyconn site, with zero runtime dependencies.
 *
 * Describe a page once (`PageMeta`, or `createPageMeta` from site defaults), then print it
 * anywhere: `renderHead` for server/prerender HTML, `toTagList` for a template that prints
 * its own tags, `applyHeadTags` for a single-page app's route changes.
 */
export type {
  HeadTag,
  JsonLdNode,
  OgType,
  PageMeta,
  SeoAlternate,
  SeoImage,
  SeoWarning,
  TwitterCard,
  TwitterMeta,
} from './types';
export {
  DESCRIPTION_LIMIT,
  ROBOTS_INDEX,
  ROBOTS_NOINDEX,
  SCHEMA_CONTEXT,
  TITLE_LIMIT,
} from './constants';
export { escapeAttribute, escapeText, serializeJsonLd } from './escape';
export { absoluteUrl, isAbsoluteUrl, toOgLocale } from './url';
export { createPageMeta, type PageInput, type SiteDefaults } from './meta';
export { toTagList } from './tags';
export { renderHead, renderTag } from './render';
export { auditMeta, type AuditLimits } from './audit';
export { applyHeadTags, MANAGED_HEAD_SELECTOR } from './dom';
export * from './jsonld';
