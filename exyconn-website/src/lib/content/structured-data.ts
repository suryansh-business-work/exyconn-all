/** Article JSON-LD for blog posts and case studies (BlogPosting / Article). */
export interface ArticleLdInput {
  type: "BlogPosting" | "Article";
  headline: string;
  description: string;
  /** Absolute URL, or "" when the piece has no image. */
  image: string;
  published: string;
  /** Absolute, market-correct URL of the page. */
  url: string;
  keywords: readonly string[];
  section?: string;
  author?: string;
  publisher: { name: string; url: string; logo: string };
}

export const articleJsonLd = (input: ArticleLdInput) => ({
  "@context": "https://schema.org",
  "@type": input.type,
  headline: input.headline,
  description: input.description,
  ...(input.image ? { image: input.image } : {}),
  datePublished: input.published,
  dateModified: input.published,
  ...(input.section ? { articleSection: input.section } : {}),
  author: input.author
    ? { "@type": "Person", name: input.author }
    : { "@type": "Organization", name: input.publisher.name, url: input.publisher.url },
  publisher: {
    "@type": "Organization",
    name: input.publisher.name,
    logo: { "@type": "ImageObject", url: input.publisher.logo },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
  url: input.url,
  keywords: input.keywords.join(", "),
});
