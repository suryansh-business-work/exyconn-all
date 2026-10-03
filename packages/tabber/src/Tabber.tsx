import { useT } from '@exyconn/i18n';
import { useId, useMemo, useState } from 'react';
import { Box, Tab, Tabs, Text, type SxProps, type Theme } from '@exyconn/shell/components/ui';
import { TabSearch } from '@exyconn/shell/components/layout/TabSearch';
import { useTabberSlug } from './useTabberSlug';
import { filterTabs } from './filterTabs';
import type { TabberItem, TabberVariant } from './tabber.types';

export interface TabberProps {
  /** Route the tabs live under, without a trailing slash, e.g. "/environment-variables". */
  basePath: string;
  items: readonly TabberItem[];
  variant?: TabberVariant;
  /** Names the tab strip for screen readers. */
  ariaLabel: string;
  /** Styling for the row that holds the tab strip and its search, e.g. the gap below it. */
  sx?: SxProps<Theme>;
}

/**
 * A tab strip whose active tab lives in the URL.
 *
 * MUI Tabs underneath, so it looks and behaves like every other tab set in the
 * portal, but the selected tab is a slug in the route rather than component
 * state — reloading, sharing the link or pressing back all keep the same tab. A search at
 * the end of the strip narrows it to the tabs whose name matches, on every portal page.
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
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const visible = filterTabs(items, query, (item) => t(item.label));
  // MUI Tabs warns about a value with no tab; a filtered-out active tab selects none.
  const shownValue = visible.some((item) => item.slug === slug) ? slug : false;
  const tabId = (value: string) => `${id}-tab-${value}`;
  const panelId = (value: string) => `${id}-panel-${value}`;
  const stripId = `${id}-strip`;

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
  };
  const goToFirstMatch = () => {
    const first = visible[0];
    if (first) {
      selectSlug(first.slug);
      closeSearch();
    }
  };

  return (
    <>
      <Box
        sx={[{ display: 'flex', alignItems: 'center', gap: 1 }, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        <Tabs
          id={stripId}
          value={shownValue}
          onChange={(_event, next: string) => {
            selectSlug(next);
            closeSearch();
          }}
          variant={variant}
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label={t(ariaLabel)}
          sx={{ flex: 1, minWidth: 0 }}
        >
          {visible.map((item) => (
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
        {visible.length === 0 && (
          <Text size="sm" color="text.secondary" role="status" sx={{ flex: 1 }}>
            {t('No tabs match "{query}"', { query: query.trim() })}
          </Text>
        )}
        <TabSearch
          open={searching}
          query={query}
          onOpen={() => setSearching(true)}
          onClose={closeSearch}
          onQueryChange={setQuery}
          onSubmit={goToFirstMatch}
          controls={stripId}
        />
      </Box>
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
