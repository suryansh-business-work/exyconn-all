import type { Crumb } from "../inner/structured-data";
import type { DetailPage, DetailSection } from "./schema";

/**
 * Pure helpers behind the detail template: breadcrumbs, related cards, list points and the
 * Service structured data.
 */
export const SECTION_LABELS: Readonly<Record<DetailSection, string>> = {
  ai: "AI",
  services: "Services",
};

const INDEX_PREFIX: Readonly<Record<DetailSection, string>> = { ai: "AI", services: "S" };

export const detailPath = (page: Pick<DetailPage, "section" | "slug">): string =>
  `/${page.section}/${page.slug}`;

export const detailCrumbs = (page: Pick<DetailPage, "section" | "name">): Crumb[] => [
  { label: "Home", href: "/" },
  { label: SECTION_LABELS[page.section], href: `/${page.section}` },
  { label: page.name },
];

/** "Example: Basic chatbots" → a bold term and its text; anything else is plain text. */
export const splitPoint = (value: string): { term?: string; text: string } => {
  const match = /^([A-Z][\w-]*(?: [\w-]+){0,2}): (.+)$/.exec(value);
  return match ? { term: match[1], text: match[2] } : { text: value };
};

/** The first sentence of a description, for a card's one-line outcome. */
export const firstSentence = (value: string): string => {
  const match = /^.+?[.!?](?=\s|$)/.exec(value.trim());
  return match ? match[0] : value.trim();
};

export interface RelatedCard {
  href: string;
  index: string;
  title: string;
  text: string;
  tags: string[];
}

/** The next `count` pages of the same section after `slug`, wrapping round. */
export const relatedPages = (
  pages: readonly DetailPage[],
  current: Pick<DetailPage, "section" | "slug">,
  count = 3
): RelatedCard[] => {
  const siblings = pages.filter((page) => page.section === current.section);
  const at = siblings.findIndex((page) => page.slug === current.slug);
  return Array.from({ length: Math.min(count, siblings.length - 1) }, (_, i) => {
    const position = (at + 1 + i) % siblings.length;
    const page = siblings[position];
    return {
      href: detailPath(page),
      index: `${INDEX_PREFIX[page.section]}/${String(position + 1).padStart(2, "0")}`,
      title: page.name,
      text: firstSentence(page.meta.description),
      tags: page.offerings.items.map((item) => item.title),
    };
  });
};

export const serviceJsonLd = (
  page: DetailPage,
  url: string,
  provider: Readonly<{ name: string; url: string }>
) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: page.name,
  description: page.meta.description,
  url,
  serviceType: SECTION_LABELS[page.section],
  provider: { "@type": "Organization", name: provider.name, url: provider.url },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: page.offerings.title,
    itemListElement: page.offerings.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      description: item.text,
    })),
  },
});

const TAB_KEYS: Readonly<Record<string, (current: number, total: number) => number>> = {
  ArrowRight: (current, total) => (current + 1) % total,
  ArrowDown: (current, total) => (current + 1) % total,
  ArrowLeft: (current, total) => (current - 1 + total) % total,
  ArrowUp: (current, total) => (current - 1 + total) % total,
  Home: () => 0,
  End: (_, total) => total - 1,
};

/** The tab a key moves to (WAI-ARIA tabs pattern, wrapping), or undefined for other keys. */
export const tabForKey = (key: string, current: number, total: number): number | undefined =>
  TAB_KEYS[key]?.(current, total);

export type DetailChapter =
  "intro" | "architecture" | "offerings" | "tabs" | "process" | "faq" | "related";

/** Chapter numbers in page order; chapters a page does not have get no number. */
export const detailChapters = (
  page: Pick<DetailPage, "section" | "architecture" | "tabs">
): Partial<Record<DetailChapter, number>> => {
  const shown: DetailChapter[] = [
    "intro",
    ...(page.architecture ? (["architecture"] as const) : []),
    "offerings",
    ...(page.tabs ? (["tabs"] as const) : []),
    ...(page.section === "services" ? (["process"] as const) : []),
    "faq",
    "related",
  ];
  return Object.fromEntries(shown.map((id, index) => [id, index + 1]));
};
