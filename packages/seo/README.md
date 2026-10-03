# @exyconn/seo

Page meta for every Exyconn site, with **zero runtime dependencies**. One typed model of a
page's `<head>`, the schema.org JSON-LD builders, and one escaped, ordered renderer — so the
website's server render, the tools prerender and the tools SPA print the same tags from the
same data.

Used by:

- `exyconn-website` — `src/layouts/Page.astro` builds every page's head with `renderHead`.
- `exyconn-tools/ui` — `scripts/prerender.ts` bakes a full head into every route's
  `index.html`; `RouteSeo` re-applies the same meta on client-side navigation.
  Tools is an npm project outside the pnpm workspace, so it consumes the source through a
  tsconfig `paths` entry and a Vite alias, and its Docker image (root build context) copies
  `packages/seo`. That is also why this package's `tsconfig.json` does not extend
  `@exyconn/config`.

## Model

```ts
import { ROBOTS_INDEX, organizationLd, webSiteLd, type PageMeta } from '@exyconn/seo';

const meta: PageMeta = {
  title: 'Merge PDF — Free Online Tool | Exyconn Tools',
  description: 'Combine PDFs in your browser…',
  canonical: 'https://tools.exyconn.com/tools/merge-pdf',
  keywords: ['merge pdf', 'combine pdf'], // or a ready "a, b" string
  robots: ROBOTS_INDEX, // or ROBOTS_NOINDEX, or any directive
  locale: 'en-US', // printed as og:locale="en_US"
  alternates: [{ hreflang: 'x-default', href: 'https://tools.exyconn.com/tools/merge-pdf' }],
  siteName: 'Exyconn Tools',
  type: 'website',
  image: {
    url: 'https://tools.exyconn.com/og-image.png',
    width: 1200,
    height: 630,
    alt: 'Exyconn Tools',
  },
  twitter: { site: '@exyconn' }, // card defaults to summary_large_image when there is an image
  themeColor: '#05061a',
  jsonLd: [webSiteLd({ name, url }), organizationLd({ name, url })],
};
```

Or derive it from site defaults (relative image URLs resolve against `origin`):

```ts
const site: SiteDefaults = {
  origin: 'https://tools.exyconn.com',
  name: 'Exyconn Tools',
  image,
  locale: 'en-US',
};
const meta = createPageMeta(site, {
  path: '/tools/merge-pdf',
  title,
  description,
  jsonLd,
  noindex: false,
});
```

## Printing it

| Function                        | Use                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `renderHead(meta, separator?)`  | Escaped HTML, one tag per line — server render / prerender.                                 |
| `toTagList(meta)`               | `HeadTag[]` (`title` / `meta` / `link` / `jsonld`) for a template that prints its own tags. |
| `renderTag(tag)`                | One `HeadTag` as HTML.                                                                      |
| `applyHeadTags(document, tags)` | SPA route change: replaces every managed tag and the title, keeps charset/viewport/icons.   |

Tag order is fixed (title, description, keywords, canonical, hreflang alternates, robots,
Open Graph, Twitter, theme colour, JSON-LD), so two renders of a page are byte-identical.
`MANAGED_HEAD_SELECTOR` lists the elements `applyHeadTags` owns.

Escaping: attributes encode `& < > " '`, the title encodes `& < >`, and JSON-LD is serialised
with JSON string escapes for `<`, `>`, `&`, U+2028 and U+2029, so no value can close the
`<script>` element while the parsed data stays unchanged.

## JSON-LD builders

`organizationLd`, `webSiteLd` (adds a `SearchAction` when given `searchUrlTemplate`),
`applicationLd` (WebApplication / SoftwareApplication), `breadcrumbLd`, `faqPageLd`,
`articleLd` (Article / BlogPosting / NewsArticle), `serviceLd`, `collectionPageLd` (with an
`ItemList`) and `organizationRef`. Each emits `@context` and `@type` first and drops unset
fields and empty lists.

## Guidance, not truncation

`auditMeta(meta, { title?, description? })` returns `SeoWarning[]` — titles over
`TITLE_LIMIT` (60), descriptions over `DESCRIPTION_LIMIT` (155), empty values, a relative
canonical, a missing share image or alt text. Nothing is ever cut: a clipped title reads
worse than a long one. The tools prerender prints these warnings at build time.

## Scripts

`pnpm --filter @exyconn/seo test` runs Vitest with a 100% statements/branches/functions/lines
gate; `typecheck` and `lint` as in every workspace package.
