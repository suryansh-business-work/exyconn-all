import { useMemo } from 'react';
import { Tab, Tabs, type SxProps, type Theme } from '@exyconn/shell/components/ui';
import { useTabberSlug } from './useTabberSlug';
import type { TabberItem, TabberVariant } from './tabber.types';

export interface TabberProps {
  /** Route the tabs live under, without a trailing slash, e.g. "/environment-variables". */
  basePath: string;
  items: readonly TabberItem[];
  variant?: TabberVariant;
  /** Names the tab strip for screen readers. */
  ariaLabel: string;
  /** Styling for the tab strip itself. */
  sx?: SxProps<Theme>;
}

/**
 * A tab strip whose active tab lives in the URL.
 *
 * MUI Tabs underneath, so it looks and behaves like every other tab set in the
 * portal, but the selected tab is a slug in the route rather than component
 * state — reloading, sharing the link or pressing back all keep the same tab.
 */
export function Tabber({
  basePath,
  items,
  variant = 'standard',
  ariaLabel,
  sx,
}: Readonly<TabberProps>) {
  const slugs = useMemo(() => items.map((item) => item.slug), [items]);
  const { slug, selectSlug } = useTabberSlug(basePath, slugs);
  const active = items.find((item) => item.slug === slug);

  return (
    <>
      <Tabs
        value={slug}
        onChange={(_event, next: string) => selectSlug(next)}
        variant={variant}
        scrollButtons="auto"
        aria-label={ariaLabel}
        sx={sx}
      >
        {items.map((item) => (
          <Tab
            key={item.slug}
            value={item.slug}
            label={item.label}
            icon={item.icon}
            iconPosition={item.icon ? 'start' : undefined}
          />
        ))}
      </Tabs>
      {active?.content}
    </>
  );
}
