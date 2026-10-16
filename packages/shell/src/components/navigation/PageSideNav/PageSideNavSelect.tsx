import { useT } from '@exyconn/i18n';
import { ListSubheader, MenuItem, TextField } from '@/components/ui';
import { groupNavItems } from './pageSideNav.model';
import type { PageSideNavItem } from './pageSideNav.types';

interface PageSideNavSelectProps {
  items: readonly PageSideNavItem[];
  selected: string;
  /** English source naming the menu, used as the field's label. */
  label: string;
  onSelect: (slug: string) => void;
}

/** The side menu on a phone: one labelled select, its options grouped by category. */
export function PageSideNavSelect({
  items,
  selected,
  label,
  onSelect,
}: Readonly<PageSideNavSelectProps>) {
  const t = useT();
  const options = groupNavItems(items).flatMap((group) => [
    <ListSubheader key={`category-${group.category}`}>{t(group.category)}</ListSubheader>,
    ...group.items.map((item) => (
      <MenuItem key={item.slug} value={item.slug}>
        {t(item.label)}
      </MenuItem>
    )),
  ]);

  return (
    <TextField
      select
      fullWidth
      label={t(label)}
      value={selected}
      onChange={(event) => onSelect(event.target.value)}
    >
      {options}
    </TextField>
  );
}
