import type { ReactElement } from 'react';

/** One entry in a page's side menu: the slug that names it in the URL, its label and group. */
export interface PageSideNavItem {
  /** URL segment for this entry, e.g. "slack" in /tech/environment-variables/slack. */
  slug: string;
  /** English source, translated where it is shown. */
  label: string;
  /** English source of the group the entry is listed under. */
  category: string;
  /** Optional leading icon. */
  icon?: ReactElement;
}

/** Grouped under category headers in the order given, or one flat list by name. */
export type PageSideNavSort = 'category' | 'asc' | 'desc';

/** A category header and the entries listed under it. */
export interface PageSideNavGroup {
  category: string;
  items: PageSideNavItem[];
}
