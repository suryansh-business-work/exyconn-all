import type { ListCaseStudiesQuery } from '@exyconn/shell/graphql/generated';

export type CaseStudyRow = ListCaseStudiesQuery['listCaseStudies'][number];

export interface CaseStudyFormValues {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  /** CSS of a body designed in the live editor; '' for a rich-text body. */
  contentCss: string;
  coverImage: string;
  category: string;
  author: string;
  tags: string[];
  pdfUrl: string;
  featured: boolean;
  isActive: boolean;
  publishedAt: string;
}
