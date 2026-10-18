import { useMemo, useState, type ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Stack, useMediaQuery, useTheme } from '@/components/ui';
import { densePanel } from '@/components/glass/glass';
import { filterNavItems } from './pageSideNav.model';
import { PageSideNavList } from './PageSideNavList';
import { PageSideNavSelect } from './PageSideNavSelect';
import { PageSideNavToolbar } from './PageSideNavToolbar';
import type { PageSideNavItem, PageSideNavSort } from './pageSideNav.types';

/** How wide the menu column is beside the content. */
const SIDE_NAV_WIDTH = 260;

export interface PageSideNavProps {
  items: readonly PageSideNavItem[];
  /** Slug of the open entry. */
  selected: string;
  onSelect: (slug: string) => void;
  /** English source naming the menu for screen readers (and the select on a phone). */
  ariaLabel: string;
  /** What the open entry shows, beside the menu (below it on a phone). */
  children: ReactNode;
}

/**
 * A page's own side menu: entries grouped under collapsible categories, with search, sort and
 * expand/collapse all, beside the content of the open entry. On a phone it becomes one select
 * above the content.
 *
 * Controlled: pair it with `useTabberSlug` from `@exyconn/tabber` so the open entry lives in the
 * URL as a slug — linkable, bookmarkable and walked by the back button, exactly like a tab.
 */
export function PageSideNav({
  items,
  selected,
  onSelect,
  ariaLabel,
  children,
}: Readonly<PageSideNavProps>) {
  const t = useT();
  const theme = useTheme();
  const onPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PageSideNavSort>('category');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const categories = useMemo(() => new Set(items.map((item) => item.category)), [items]);
  const visible = filterNavItems(items, query, t);
  const searching = query.trim() !== '';
  const allExpanded = [...categories].every((category) => !collapsed.has(category));
  const active = items.find((item) => item.slug === selected);
  const content = (
    <Box component="section" aria-label={active ? t(active.label) : undefined} sx={{ minWidth: 0 }}>
      {children}
    </Box>
  );

  const toggle = (category: string) => {
    const next = new Set(collapsed);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    setCollapsed(next);
  };

  if (onPhone) {
    return (
      <Stack spacing={2}>
        <Box component="nav" aria-label={t(ariaLabel)}>
          <PageSideNavSelect
            items={items}
            selected={selected}
            label={ariaLabel}
            onSelect={onSelect}
          />
        </Box>
        {content}
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `${SIDE_NAV_WIDTH}px minmax(0, 1fr)`,
        gap: 2,
        alignItems: 'start',
      }}
    >
      <Box component="nav" aria-label={t(ariaLabel)} sx={densePanel}>
        <PageSideNavToolbar
          query={query}
          onQueryChange={setQuery}
          sort={sort}
          onSortChange={setSort}
          canFold={sort === 'category' && !searching}
          allExpanded={allExpanded}
          onToggleAll={() => setCollapsed(allExpanded ? new Set(categories) : new Set())}
        />
        <PageSideNavList
          items={visible}
          sort={sort}
          selected={selected}
          collapsed={collapsed}
          searching={searching}
          query={query}
          onToggle={toggle}
          onSelect={onSelect}
        />
      </Box>
      {content}
    </Box>
  );
}
