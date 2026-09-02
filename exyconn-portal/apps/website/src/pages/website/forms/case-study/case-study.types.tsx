import type { ListCaseStudiesQuery } from '@exyconn/shell/graphql/generated';

export type CaseStudyRow = ListCaseStudiesQuery['listCaseStudies'][number];

export interface CaseStudyFormValues {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  tags: string[];
  pdfUrl: string;
  featured: boolean;
  isActive: boolean;
  publishedAt: string;
}
