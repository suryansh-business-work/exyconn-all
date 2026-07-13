export interface SEOIssue {
  type: string;
  severity: string;
  message: string;
}

export interface SEOResult {
  url: string;
  score: number;
  title: { text: string; length: number };
  metaDescription: { text: string; length: number };
  metaKeywords: string;
  canonical: string;
  robots: string;
  openGraph: { title: string; description: string; image: string };
  twitterCard: string;
  viewport: string;
  language: string;
  favicon: string;
  headings: Record<string, string[]>;
  images: { total: number; withAlt: number; withoutAlt: number };
  links: { internal: number; external: number; nofollow: number; total: number };
  wordCount: number;
  schemaMarkup: string[];
  issues: SEOIssue[];
}
