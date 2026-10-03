/**
 * schema.org JSON-LD for the inner blocks. FaqAccordion emits its own FAQPage; pages pass
 * the breadcrumb list to Page's `jsonLd` prop.
 */
export interface FaqItem {
  question: string;
  /** Plain text: it is both rendered and published as the answer. */
  answer: string;
}

export interface Crumb {
  label: string;
  /** Root-relative or absolute. The current page's crumb may omit it. */
  href?: string;
}

export const faqJsonLd = (items: readonly FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
});

const absolute = (href: string, siteUrl: string): string =>
  /^https?:\/\//i.test(href) ? href : `${siteUrl.replace(/\/$/, "")}${href}`;

export const breadcrumbJsonLd = (crumbs: readonly Crumb[], siteUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.label,
    ...(crumb.href ? { item: absolute(crumb.href, siteUrl) } : {}),
  })),
});

export interface ServiceLd {
  name: string;
  description: string;
  /** The page's own absolute URL. */
  url: string;
  /** e.g. "AI agents" or "Software development". */
  serviceType?: string;
  areaServed?: string;
  provider: Readonly<{ name: string; url: string }>;
  /** What the service includes, published as its offer catalogue. */
  offers?: Readonly<{
    title: string;
    items: readonly Readonly<{ name: string; description?: string }>[];
  }>;
}

const offerCatalog = (offers: NonNullable<ServiceLd["offers"]>) => ({
  "@type": "OfferCatalog",
  name: offers.title,
  itemListElement: offers.items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    ...(item.description ? { description: item.description } : {}),
  })),
});

/** schema.org Service for a service or capability page; pass it to Page's `jsonLd`. */
export const serviceJsonLd = (service: ServiceLd) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: service.name,
  description: service.description,
  url: service.url,
  ...(service.serviceType ? { serviceType: service.serviceType } : {}),
  ...(service.areaServed ? { areaServed: service.areaServed } : {}),
  provider: { "@type": "Organization", name: service.provider.name, url: service.provider.url },
  ...(service.offers?.items.length ? { hasOfferCatalog: offerCatalog(service.offers) } : {}),
});
