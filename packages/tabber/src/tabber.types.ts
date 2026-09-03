import type { ReactElement, ReactNode } from 'react';

/** One tab: the slug that names it in the URL, its label, and what it shows. */
export interface TabberItem {
  /** URL segment for this tab, e.g. "slack" in /environment-variables/slack. */
  slug: string;
  label: string;
  /** Optional leading icon, rendered before the label. */
  icon?: ReactElement;
  /** Rendered only while this tab is the active one. */
  content: ReactNode;
}

/** How the underlying MUI Tabs strip lays itself out. */
export type TabberVariant = 'standard' | 'scrollable' | 'fullWidth';
