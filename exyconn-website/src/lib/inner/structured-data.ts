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
