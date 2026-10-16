import { useId } from 'react';
import { useT } from '@exyconn/i18n';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Collapse, List, ListItemButton, ListItemText, Typography } from '@/components/ui';
import { groupNavItems, sortNavItems } from './pageSideNav.model';
import { PageSideNavEntry } from './PageSideNavEntry';
import type { PageSideNavGroup, PageSideNavItem, PageSideNavSort } from './pageSideNav.types';

interface PageSideNavListProps {
  /** The entries left after the search. */
  items: readonly PageSideNavItem[];
  sort: PageSideNavSort;
  selected: string;
  /** Categories the reader folded away. */
  collapsed: ReadonlySet<string>;
  /** While searching every group stays open, so no match is hidden. */
  searching: boolean;
  query: string;
  onToggle: (category: string) => void;
  onSelect: (slug: string) => void;
}

interface PageSideNavGroupBlockProps {
  group: PageSideNavGroup;
  open: boolean;
  selected: string;
  onToggle: (category: string) => void;
  onSelect: (slug: string) => void;
}

/** A category header that folds its entries away, and the entries under it. */
function PageSideNavGroupBlock({
  group,
  open,
  selected,
  onToggle,
  onSelect,
}: Readonly<PageSideNavGroupBlockProps>) {
  const t = useT();
  const listId = useId();
  return (
    <>
      <ListItemButton
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => onToggle(group.category)}
      >
        <ListItemText
          primary={t(group.category)}
          slotProps={{ primary: { variant: 'overline', color: 'text.secondary' } }}
        />
        {open ? <ExpandLessIcon aria-hidden /> : <ExpandMoreIcon aria-hidden />}
      </ListItemButton>
      <Collapse in={open} unmountOnExit>
        <List id={listId} component="div" disablePadding>
          {group.items.map((item) => (
            <PageSideNavEntry
              key={item.slug}
              item={item}
              selected={item.slug === selected}
              nested
              onSelect={onSelect}
            />
          ))}
        </List>
      </Collapse>
    </>
  );
}

/** The menu body: grouped under collapsible categories, or one list sorted by name. */
export function PageSideNavList({
  items,
  sort,
  selected,
  collapsed,
  searching,
  query,
  onToggle,
  onSelect,
}: Readonly<PageSideNavListProps>) {
  const t = useT();

  if (items.length === 0) {
    return (
      <Typography variant="body2" role="status" sx={{ color: 'text.secondary', px: 2, py: 1 }}>
        {t('Nothing matches "{query}"', { query: query.trim() })}
      </Typography>
    );
  }

  if (sort !== 'category') {
    return (
      <List component="div" disablePadding>
        {sortNavItems(items, sort, t).map((item) => (
          <PageSideNavEntry
            key={item.slug}
            item={item}
            selected={item.slug === selected}
            nested={false}
            onSelect={onSelect}
          />
        ))}
      </List>
    );
  }

  return (
    <List component="div" disablePadding>
      {groupNavItems(items).map((group) => (
        <PageSideNavGroupBlock
          key={group.category}
          group={group}
          open={searching || !collapsed.has(group.category)}
          selected={selected}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </List>
  );
}
