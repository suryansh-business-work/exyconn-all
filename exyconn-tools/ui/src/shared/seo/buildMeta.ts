/**
 * Pure meta-tag builder shared by the runtime SPA (applyMeta) and the
 * build-time prerenderer (scripts/prerender.ts). No DOM access here.
 */
import type { ToolDetailContent } from '../data/toolDetails/types';

export const SITE_ORIGIN = 'https://tools.exyconn.com';
export const SITE_NAME = 'Exyconn Tools';
export const DEFAULT_DESCRIPTION =
  'Free online tools for SEO, sitemaps, domains, PDFs, images, AI content and more — fast, private and no signup required.';

export interface ToolMetaInput {
  id: string;
  name: string;
  description: string;
  categoryName: string;
  details?: ToolDetailContent;
}

export interface BuiltMeta {
  title: string;
  description: string;
  canonical: string;
  keywords: string;
  ogTags: Record<string, string>;
  twitterTags: Record<string, string>;
  jsonLd: object[];
}

export function buildToolMeta(input: ToolMetaInput): BuiltMeta {
  const { id, name, description, categoryName, details } = input;
  const url = `${SITE_ORIGIN}/tools/${id}`;
  const title = details?.metaTitle ?? `${name} — Free Online Tool | ${SITE_NAME}`;
  const metaDescription = details?.metaDescription ?? description;
  const keywords = (details?.keywords ?? [name, 'free online tool', 'exyconn']).join(', ');

  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name,
      description: metaDescription,
      applicationCategory: 'WebApplication',
      operatingSystem: 'All',
      url,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      provider: { '@type': 'Organization', name: 'Exyconn', url: 'https://exyconn.com' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/tools` },
        { '@type': 'ListItem', position: 2, name: categoryName, item: `${SITE_ORIGIN}/tools` },
        { '@type': 'ListItem', position: 3, name, item: url },
      ],
    },
  ];

  if (details?.faqs?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: details.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  return {
    title,
    description: metaDescription,
    canonical: url,
    keywords,
    ogTags: {
      'og:site_name': SITE_NAME,
      'og:type': 'website',
      'og:title': title,
      'og:description': metaDescription,
      'og:url': url,
    },
    twitterTags: {
      'twitter:card': 'summary',
      'twitter:title': title,
      'twitter:description': metaDescription,
    },
    jsonLd,
  };
}
