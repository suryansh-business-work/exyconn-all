import { useT } from '@exyconn/i18n';
import { useId, useMemo } from 'react';
import { Box, Tab, Tabs, type SxProps, type Theme } from '@exyconn/shell/components/ui';
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
  // Scrollable by default: a `standard` strip of six tabs runs off a phone screen with no
  // way to reach the rest, and `scrollButtons` only does anything on a scrollable one.
  variant = 'scrollable',
  ariaLabel,
  sx,
}: Readonly<TabberProps>) {
  const t = useT();
  const id = useId();
  const slugs = useMemo(() => items.map((item) => item.slug), [items]);
  const { slug, selectSlug } = useTabberSlug(basePath, slugs);
  const active = items.find((item) => item.slug === slug);
  const tabId = (value: string) => `${id}-tab-${value}`;
  const panelId = (value: string) => `${id}-panel-${value}`;

  return (
    <>
      <Tabs
        value={slug}
        onChange={(_event, next: string) => selectSlug(next)}
        variant={variant}
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label={t(ariaLabel)}
        sx={sx}
      >
        {items.map((item) => (
          <Tab
            key={item.slug}
            id={tabId(item.slug)}
            aria-controls={panelId(item.slug)}
            value={item.slug}
            label={t(item.label)}
            icon={item.icon}
            iconPosition={item.icon ? 'start' : undefined}
          />
        ))}
      </Tabs>
      {/* The panel the tab controls (WAI-ARIA tabs): named by its tab, so a screen reader
          says which one it has landed in. */}
      {active && (
        <Box role="tabpanel" id={panelId(active.slug)} aria-labelledby={tabId(active.slug)}>
          {active.content}
        </Box>
      )}
    </>
  );
}
