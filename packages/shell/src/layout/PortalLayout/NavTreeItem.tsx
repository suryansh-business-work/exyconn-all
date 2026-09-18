import { useT } from '@exyconn/i18n';
import { useId } from 'react';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  fontWeight,
} from '@/components/ui';
import type { NavNode } from './moduleNav';
import type { NavState } from './useNavState';

interface Props {
  node: NavNode;
  /** 0 for the top level. Each level below indents one step further. */
  depth: number;
  nav: NavState;
  onSelect: (node: NavNode) => void;
}

const rowSx = (depth: number) => ({ borderRadius: 1, mb: 0.5, py: 0.5, pl: 1.5 + depth * 1.5 });

/**
 * One page in the sidebar.
 *
 * The icon is muted until the row is the current page, which the theme then fills with the
 * muted surface and the foreground ink — the icon takes that ink too. Thirty-three rows each wearing the
 * module's colour is thirty-three things competing to be looked at, and the one that matters —
 * where you are — stops standing out at all.
 */
function NavLeaf({ node, depth, nav, onSelect }: Readonly<Props>) {
  const t = useT();
  const Icon = node.icon;
  const selected = node.path === nav.activePath;
  return (
    <ListItemButton
      selected={selected}
      // Announces the current page to a screen reader, which `selected` alone does not.
      aria-current={selected ? 'page' : undefined}
      onClick={() => onSelect(node)}
      sx={rowSx(depth)}
    >
      <ListItemIcon sx={{ minWidth: 32, color: selected ? 'inherit' : 'text.secondary' }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={t(node.label)}
        slotProps={{
          primary: {
            variant: 'body2',
            noWrap: true,
            sx: { fontWeight: selected ? fontWeight.semibold : fontWeight.regular },
          },
        }}
      />
    </ListItemButton>
  );
}

/**
 * An entry with pages beneath it. The row is a real button with `aria-expanded` and
 * `aria-controls`, not a styled div: a branch a keyboard cannot open is a branch that half
 * the pages live behind.
 */
function NavBranch({ node, depth, nav, onSelect }: Readonly<Props>) {
  const t = useT();
  const listId = useId();
  const Icon = node.icon;
  const expanded = nav.isOpen(node.key);
  const onTrail = nav.trail.has(node.key);
  return (
    <>
      <ListItemButton
        onClick={() => nav.toggle(node.key)}
        aria-expanded={expanded}
        aria-controls={listId}
        sx={rowSx(depth)}
      >
        <ListItemIcon sx={{ minWidth: 32, color: onTrail ? 'text.primary' : 'text.secondary' }}>
          <Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={t(node.label)}
          slotProps={{
            primary: { variant: 'body2', noWrap: true, sx: { fontWeight: fontWeight.semibold } },
          }}
        />
        {expanded ? (
          <ExpandLess fontSize="small" color="disabled" />
        ) : (
          <ExpandMore fontSize="small" color="disabled" />
        )}
      </ListItemButton>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {/* A group of buttons, not list items: as a `<ul>` its children would have to be `<li>`. */}
        <List id={listId} component="div" role="group" aria-label={t(node.label)} disablePadding>
          {node.children.map((child) => (
            <NavTreeItem
              key={child.key}
              node={child}
              depth={depth + 1}
              nav={nav}
              onSelect={onSelect}
            />
          ))}
        </List>
      </Collapse>
    </>
  );
}

/** One entry of the sidebar tree, drawn as a page or as a branch that opens. */
export function NavTreeItem(props: Readonly<Props>) {
  return props.node.children.length > 0 ? <NavBranch {...props} /> : <NavLeaf {...props} />;
}
