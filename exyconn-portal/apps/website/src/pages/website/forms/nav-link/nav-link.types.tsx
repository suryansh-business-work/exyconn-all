import type { ListNavLinksQuery } from '@exyconn/shell/graphql/generated';

export type NavLinkRow = ListNavLinksQuery['listNavLinks'][number];

export interface NavLinkFormValues {
  label: string;
  href: string;
  description: string;
  category: string;
  /** Comma-separated search keywords — a plain string on the server, not an array. */
  keywords: string;
  isActive: boolean;
  order: number;
}
