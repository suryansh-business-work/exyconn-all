/**
 * Page meta for every route of the tools site — the one source of truth for the
 * prerendered HTML head and the live head after client-side navigation.
 */
import {
  applicationLd,
  breadcrumbLd,
  collectionPageLd,
  createPageMeta,
  faqPageLd,
  organizationLd,
  webSiteLd,
  type JsonLdNode,
  type NamedLink,
  type PageMeta,
} from '@exyconn/seo';
import { toolsData, getAllTools, type ToolCategory, type ToolItem } from '../data/toolsData';
import { getToolDetails } from '../data/toolDetails';
import { HUB_DESCRIPTION, HUB_PATH, ORGANIZATION, SITE, SITE_NAME, SITE_ORIGIN, categoryPath } from './site';

const absolute = (path: string): string => `${SITE_ORIGIN}${path}`;

const hubCrumb: NamedLink = { name: SITE_NAME, url: absolute(HUB_PATH) };
const categoryCrumb = (category: ToolCategory): NamedLink => ({
  name: category.category,
  url: absolute(categoryPath(category.slug)),
});

export function hubMeta(): PageMeta {
  const total = getAllTools().length;
  return createPageMeta(SITE, {
    path: HUB_PATH,
    title: `${total} Free Online Tools: SEO, PDF, Image & AI | Exyconn`,
    description: HUB_DESCRIPTION,
    keywords: ['free online tools', ...toolsData.map((category) => category.category.toLowerCase())],
    jsonLd: [
      webSiteLd({
        name: SITE_NAME,
        url: absolute(HUB_PATH),
        description: HUB_DESCRIPTION,
        searchUrlTemplate: `${absolute(HUB_PATH)}?q={search_term_string}`,
      }),
      organizationLd({ ...ORGANIZATION, sameAs: [...ORGANIZATION.sameAs] }),
      collectionPageLd({
        name: `Free online tools | ${SITE_NAME}`,
        description: HUB_DESCRIPTION,
        url: absolute(HUB_PATH),
        items: toolsData.map(categoryCrumb),
      }),
    ],
  });
}

export function categoryMeta(category: ToolCategory): PageMeta {
  const path = categoryPath(category.slug);
  return createPageMeta(SITE, {
    path,
    title: `Free ${category.category} Online | ${SITE_NAME}`,
    description: category.description,
    keywords: [category.category.toLowerCase(), ...category.items.slice(0, 8).map((tool) => tool.name.toLowerCase())],
    jsonLd: [
      collectionPageLd({
        name: category.category,
        description: category.description,
        url: absolute(path),
        items: category.items.map((tool) => ({ name: tool.name, url: absolute(tool.url) })),
      }),
      breadcrumbLd([hubCrumb, categoryCrumb(category)]),
    ],
  });
}

export function toolMeta(tool: ToolItem, category: ToolCategory): PageMeta {
  const details = getToolDetails(tool.id);
  const description = details?.metaDescription ?? tool.description;
  const jsonLd: JsonLdNode[] = [
    applicationLd({
      name: tool.name,
      url: absolute(tool.url),
      description,
      applicationCategory: 'UtilitiesApplication',
      image: absolute('/og-image.png'),
      offer: { price: '0', priceCurrency: 'USD' },
      provider: ORGANIZATION,
    }),
    breadcrumbLd([hubCrumb, categoryCrumb(category), { name: tool.name, url: absolute(tool.url) }]),
  ];
  if (details?.faqs.length) {
    jsonLd.push(faqPageLd(details.faqs));
  }
  return createPageMeta(SITE, {
    path: tool.url,
    title: details?.metaTitle ?? `${tool.name} — Free Online Tool | ${SITE_NAME}`,
    description,
    keywords: details?.keywords ?? [tool.name.toLowerCase(), 'free online tool'],
    jsonLd,
  });
}

export function notFoundMeta(path: string): PageMeta {
  return createPageMeta(SITE, {
    path,
    title: `Page not found | ${SITE_NAME}`,
    description: HUB_DESCRIPTION,
    noindex: true,
  });
}
