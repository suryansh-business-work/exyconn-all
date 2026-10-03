import { serializeJsonLd } from './escape';
import type { HeadTag, PageMeta, SeoImage, TwitterMeta } from './types';
import { toOgLocale } from './url';

type Attrs = Record<string, string>;

const named = (name: string, content: string): HeadTag => ({
  kind: 'meta',
  attrs: { name, content },
});
const property = (key: string, content: string): HeadTag => ({
  kind: 'meta',
  attrs: { property: key, content },
});

/** `[tag]` when the value is set, otherwise nothing — keeps the list free of empty tags. */
function when<T>(value: T | undefined, build: (present: T) => HeadTag): HeadTag[] {
  return value === undefined || value === '' ? [] : [build(value)];
}

function keywordText(keywords: PageMeta['keywords']): string | undefined {
  if (keywords === undefined || typeof keywords === 'string') {
    return keywords;
  }
  return keywords.join(', ');
}

function imageTags(image: SeoImage | undefined): HeadTag[] {
  if (!image) {
    return [];
  }
  return [
    property('og:image', image.url),
    ...when(image.type, (type) => property('og:image:type', type)),
    ...when(image.width, (width) => property('og:image:width', String(width))),
    ...when(image.height, (height) => property('og:image:height', String(height))),
    ...when(image.alt, (alt) => property('og:image:alt', alt)),
  ];
}

function twitterTags(meta: PageMeta): HeadTag[] {
  const twitter: TwitterMeta = meta.twitter ?? {};
  const fallbackCard = meta.image ? 'summary_large_image' : 'summary';
  return [
    named('twitter:card', twitter.card ?? fallbackCard),
    ...when(twitter.site, (site) => named('twitter:site', site)),
    ...when(twitter.creator, (creator) => named('twitter:creator', creator)),
    named('twitter:title', meta.title),
    named('twitter:description', meta.description),
    ...when(meta.image, (image) => named('twitter:image', image.url)),
    ...when(meta.image?.alt, (alt) => named('twitter:image:alt', alt)),
  ];
}

function linkTag(attrs: Attrs): HeadTag {
  return { kind: 'link', attrs };
}

/**
 * The page's head as an ordered list of tags. The order is fixed — identity, discovery,
 * indexing, social, then structured data — so two renders of one page are byte-identical.
 */
export function toTagList(meta: PageMeta): HeadTag[] {
  return [
    { kind: 'title', text: meta.title },
    named('description', meta.description),
    ...when(keywordText(meta.keywords), (keywords) => named('keywords', keywords)),
    linkTag({ rel: 'canonical', href: meta.canonical }),
    ...(meta.alternates ?? []).map((alternate) =>
      linkTag({ rel: 'alternate', hreflang: alternate.hreflang, href: alternate.href }),
    ),
    ...when(meta.robots, (robots) => named('robots', robots)),
    ...when(meta.siteName, (siteName) => property('og:site_name', siteName)),
    property('og:type', meta.type ?? 'website'),
    property('og:url', meta.canonical),
    property('og:title', meta.title),
    property('og:description', meta.description),
    ...when(meta.locale, (locale) => property('og:locale', toOgLocale(locale))),
    ...imageTags(meta.image),
    ...twitterTags(meta),
    ...when(meta.themeColor, (color) => named('theme-color', color)),
    ...(meta.jsonLd ?? []).map((node): HeadTag => ({
      kind: 'jsonld',
      json: serializeJsonLd(node),
    })),
  ];
}
