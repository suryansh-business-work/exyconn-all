import { useId } from 'react';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Box, Collapse, List, ListItemButton, ListItemText } from '@/components/ui';
import { NavLink } from './NavLink';
import type { NavItem } from './moduleNav';

interface Props {
  label: string;
  items: NavItem[];
  activePath?: string;
  accent: string;
  expanded: boolean;
  onToggle: (label: string) => void;
  onSelect: (path: string) => void;
}

/**
 * One collapsible run of pages under a heading.
 *
 * The heading is a real button with `aria-expanded` and `aria-controls`, not a styled div:
 * a section a keyboard cannot open is a section that half the pages live behind.
 */
export function NavSectionGroup({
  label,
  items,
  activePath,
  accent,
  expanded,
  onToggle,
  onSelect,
}: Readonly<Props>) {
  const listId = useId();

  return (
    <Box sx={{ mb: 0.25 }}>
      <ListItemButton
        onClick={() => onToggle(label)}
        aria-expanded={expanded}
        aria-controls={listId}
        sx={{ borderRadius: 1.5, py: 0.35, pl: 1.25 }}
      >
        <ListItemText
          primary={label}
          slotProps={{
            primary: {
              variant: 'overline',
              color: 'text.secondary',

              sx: {
                letterSpacing: 0.8,
                lineHeight: 1.8,
              },
            },
          }}
        />
        {expanded ? (
          <ExpandLess fontSize="small" color="disabled" />
        ) : (
          <ExpandMore fontSize="small" color="disabled" />
        )}
      </ListItemButton>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List id={listId} disablePadding sx={{ pl: 0.5 }}>
          {items.map((item) => (
            <NavLink
              key={item.key}
              item={item}
              selected={activePath === item.path}
              accent={accent}
              onSelect={onSelect}
            />
          ))}
        </List>
      </Collapse>
    </Box>
  );
}
