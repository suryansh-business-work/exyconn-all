import { List, Typography } from '@/components/ui';
import type { NavNode } from './moduleNav';
import type { NavState } from './useNavState';
import { NavTreeItem } from './NavTreeItem';

interface SidebarNavProps {
  /** Shown above the list — the module's name in a module app, nothing in the hub. */
  heading?: string;
  /** What to say when a search finds nothing. */
  emptyText: string;
  nav: NavState;
  onSelect: (node: NavNode) => void;
}

/** The expanded sidebar: the whole navigation tree, as deep as the config nests it. */
export function SidebarNav({ heading, emptyText, nav, onSelect }: Readonly<SidebarNavProps>) {
  return (
    <>
      {heading && (
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', px: 2, pt: 0.5, display: 'block', letterSpacing: 1 }}
        >
          {heading}
        </Typography>
      )}
      <List component="div" sx={{ px: 1, py: 0.5 }}>
        {nav.searching && nav.visible.length === 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary', px: 1.5 }}>
            {emptyText}
          </Typography>
        )}
        {nav.visible.map((node) => (
          <NavTreeItem key={node.key} node={node} depth={0} nav={nav} onSelect={onSelect} />
        ))}
      </List>
    </>
  );
}
