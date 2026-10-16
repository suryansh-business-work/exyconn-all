import { useT } from '@exyconn/i18n';
import { ListItemButton, ListItemIcon, ListItemText } from '@/components/ui';
import type { PageSideNavItem } from './pageSideNav.types';

interface PageSideNavEntryProps {
  item: PageSideNavItem;
  selected: boolean;
  /** Indented under a category header. */
  nested: boolean;
  onSelect: (slug: string) => void;
}

/** One entry in the side menu; the open one is marked `aria-current="page"`. */
export function PageSideNavEntry({
  item,
  selected,
  nested,
  onSelect,
}: Readonly<PageSideNavEntryProps>) {
  const t = useT();
  return (
    <ListItemButton
      selected={selected}
      aria-current={selected ? 'page' : undefined}
      onClick={() => onSelect(item.slug)}
      sx={{ pl: nested ? 3 : 2 }}
    >
      {item.icon && <ListItemIcon aria-hidden>{item.icon}</ListItemIcon>}
      <ListItemText primary={t(item.label)} />
    </ListItemButton>
  );
}
