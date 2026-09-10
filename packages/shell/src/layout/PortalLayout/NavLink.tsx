import { ListItemButton, ListItemIcon, ListItemText } from '@/components/ui';
import type { NavItem } from './moduleNav';

interface Props {
  item: NavItem;
  selected: boolean;
  /** The module's colour. Worn only by the selected row — see the note below. */
  accent: string;
  onSelect: (path: string) => void;
}

/**
 * One page in the sidebar.
 *
 * The icon is muted until the row is the current page. Thirty-three rows each wearing the
 * module's colour is thirty-three things competing to be looked at, and the one that
 * matters — where you are — stops standing out at all.
 */
export function NavLink({ item, selected, accent, onSelect }: Readonly<Props>) {
  const Icon = item.icon;
  return (
    <ListItemButton
      selected={selected}
      // Announces the current page to a screen reader, which `selected` alone does not.
      aria-current={selected ? 'page' : undefined}
      onClick={() => onSelect(item.path)}
      sx={{ borderRadius: 1.5, mb: 0.25, py: 0.6, pl: 1.25 }}
    >
      <ListItemIcon sx={{ minWidth: 32, color: selected ? accent : 'text.disabled' }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        slotProps={{
          primary: {
            variant: 'body2',
            noWrap: true,

            sx: {
              fontWeight: selected ? 600 : 400
            }
          }
        }}
      />
    </ListItemButton>
  );
}
