import type { ListBlogPostsQuery } from '@exyconn/shell/graphql/generated';

export type BlogRow = ListBlogPostsQuery['listBlogPosts'][number];

export interface BlogAuthorFormValues {
  name: string;
  role: string;
  initials: string;
}

export interface BlogPostFormValues {
  slug: string;
  title: string;
  summary: string;
  content: string;
  author: BlogAuthorFormValues;
  readTime: string;
  tags: string[];
  coverImage: string;
  featured: boolean;
  isActive: boolean;
  publishedAt: string;
}
