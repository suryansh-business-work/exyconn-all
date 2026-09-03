import { List, ListItemButton, ListItemIcon, Tooltip } from '@/components/ui';
import type { RailItem } from './moduleNav';

interface SidebarRailProps {
  items: RailItem[];
  activePath?: string;
  onSelect: (item: RailItem) => void;
}

/**
 * Icon-only navigation for the collapsed sidebar. Labels move into tooltips rather than
 * disappearing, so the rail stays usable while the drawer gives the page back its width.
 */
export function SidebarRail({ items, activePath, onSelect }: Readonly<SidebarRailProps>) {
  return (
    <List sx={{ px: 0.75, py: 0.5 }}>
      {items.map((item) => (
        <Tooltip key={item.key} title={item.label} placement="right">
          <ListItemButton
            selected={activePath === item.path}
            onClick={() => onSelect(item)}
            aria-label={item.label}
            sx={{ borderRadius: 1.5, mb: 0.25, justifyContent: 'center', px: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 0, color: item.accent }}>
              <item.icon fontSize="small" />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
      ))}
    </List>
  );
}
