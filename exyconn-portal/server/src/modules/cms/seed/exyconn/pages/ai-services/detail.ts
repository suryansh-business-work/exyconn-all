import type { CmsSeedPage } from '../../../types';
import { seedPage } from '../../page-doc';
import { defaultsOf } from '../place';
import {
  AI_SERVICES_PATH,
  AI_SERVICE_CATEGORIES,
  SITE,
  aiServicePath,
  listItems,
  type AiServiceCategory,
  type AiServiceEntry,
} from './catalogue';
import details from './details.json';

/** What a service page says beyond its catalogue entry. */
interface AiServiceDetail {
  description: string;
  outcomes: string[];
}

const SERVICE_DETAILS: Record<string, AiServiceDetail> = details.services;
const SCENES: Record<string, unknown> = details.scenes;
const HOME = { label: 'Home', href: '/' };
const HUB = { label: 'AI services', href: AI_SERVICES_PATH };

/** One AI service page (/ai-services/<slug>): the same sections for every service. */
function detailPage(category: AiServiceCategory, service: AiServiceEntry): CmsSeedPage {
  const { description, outcomes } = SERVICE_DETAILS[service.slug];
  const path = aiServicePath(service);
  const title = `${service.title} | AI Services | Exyconn`;
  const categoryCrumb = {
    label: category.title,
    href: `${AI_SERVICES_PATH}?cat=${category.slug}`,
  };
  const trail = [HOME, HUB, categoryCrumb];
  const approach = defaultsOf('aiservice.approach');
  const related = category.services
    .filter((other) => other.slug !== service.slug)
    .slice(0, 3)
    .map((other) => ({ href: aiServicePath(other), title: other.title, text: other.summary }));

  return seedPage({
    key: `ai-services-${service.slug}`,
    path,
    title,
    seo: {
      title,
      description: service.summary,
      keywords: `${service.title}, ${category.title}, AI services, Exyconn`,
      ogImageUrl: '',
      canonical: `${SITE}${path}`,
      noindex: false,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.title,
          description,
          url: `${SITE}${path}`,
          serviceType: category.title,
          category: category.title,
          areaServed: 'Worldwide',
          provider: { '@type': 'Organization', name: 'Exyconn', url: SITE },
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: `${service.title} deliverables`,
            itemListElement: listItems(outcomes, (name) => ({ name })),
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            ...listItems(trail, (crumb) => ({
              name: crumb.label,
              item: `${SITE}${crumb.href}`,
            })),
            { '@type': 'ListItem', position: trail.length + 1, name: service.title },
          ],
        },
      ],
    },
    body: [
      {
        component: 'detail.stage',
        props: {
          family: details.stage.family,
          crumbs: [...trail, { label: service.title, href: '' }],
          title: service.title,
          lede: service.summary,
          primary: details.stage.primary,
          secondary: details.stage.secondary,
          scene: SCENES[category.slug],
          glyph: details.stage.glyph,
          tagline: details.stage.tagline,
        },
      },
      {
        component: 'aiservice.approach',
        props: {
          ...approach,
          description,
          category: {
            ...(approach.category as Record<string, unknown>),
            title: category.title,
            description: category.description,
            href: categoryCrumb.href,
          },
        },
      },
      {
        component: 'aiservice.outcomes',
        props: { ...defaultsOf('aiservice.outcomes'), outcomes },
      },
      {
        component: 'aiservice.related',
        props: {
          ...defaultsOf('aiservice.related'),
          title: `More in ${category.title}`,
          services: related,
        },
      },
      { component: 'detail.cta', props: details.cta },
    ],
  });
}

/** Every AI service page, in catalogue order. */
export const AI_SERVICE_DETAIL_PAGES: CmsSeedPage[] = AI_SERVICE_CATEGORIES.flatMap((category) =>
  category.services.map((service) => detailPage(category, service)),
);
