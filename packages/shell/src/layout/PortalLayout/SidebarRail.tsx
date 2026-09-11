import { List, ListItemButton, ListItemIcon, Tooltip } from '@/components/ui';
import type { NavNode } from './moduleNav';

interface SidebarRailProps {
  /** The top level of the tree only — nothing beneath it is drawn here. */
  nodes: NavNode[];
  /** Keys of the current page and the branches above it. */
  trail: ReadonlySet<string>;
  onSelect: (node: NavNode) => void;
}

/**
 * Icon-only navigation for the collapsed sidebar. It shows the top level alone: a branch
 * stands in for everything beneath it and opens the sidebar at that branch when clicked.
 * Labels move into tooltips rather than disappearing, so the rail stays usable while the
 * drawer gives the page back its width.
 */
export function SidebarRail({ nodes, trail, onSelect }: Readonly<SidebarRailProps>) {
  return (
    <List sx={{ px: 0.75, py: 0.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {nodes.map((node) => {
        const current = trail.has(node.key);
        const isPage = node.children.length === 0;
        return (
          <Tooltip key={node.key} title={node.label} placement="right" arrow>
            <ListItemButton
              selected={current}
              aria-current={current && isPage ? 'page' : undefined}
              aria-label={node.label}
              onClick={() => onSelect(node)}
              sx={{ borderRadius: 1.5, justifyContent: 'center', minHeight: 40, px: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 0, color: node.accent }}>
                <node.icon fontSize="small" />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        );
      })}
    </List>
  );
}
